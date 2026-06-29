/**
 * Session management utilities
 */

import { setSessionCookie, getSessionId, clearSessionCookie } from './cookie-security';

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
}

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
const SESSION_WARNING = 5 * 60 * 1000; // 5 minutes warning

let sessionData: SessionData | null = null;
let sessionTimeout: NodeJS.Timeout | null = null;
let warningTimeout: NodeJS.Timeout | null = null;

/**
 * Initialize session
 */
export function initializeSession(userData: {
  userId: string;
  email: string;
  role: string;
}): void {
  const now = Date.now();
  sessionData = {
    ...userData,
    createdAt: now,
    expiresAt: now + SESSION_DURATION,
    lastActivity: now,
  };

  // Set session cookie
  setSessionCookie(generateSessionId(), SESSION_DURATION / 1000);

  // Start session timeout
  startSessionTimeout();
  startSessionWarning();
}

/**
 * Generate session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Start session timeout
 */
function startSessionTimeout(): void {
  if (sessionTimeout) {
    clearTimeout(sessionTimeout);
  }

  sessionTimeout = setTimeout(() => {
    endSession();
  }, SESSION_DURATION);
}

/**
 * Start session warning
 */
function startSessionWarning(): void {
  if (warningTimeout) {
    clearTimeout(warningTimeout);
  }

  warningTimeout = setTimeout(() => {
    showSessionWarning();
  }, SESSION_DURATION - SESSION_WARNING);
}

/**
 * Show session warning
 */
function showSessionWarning(): void {
  // Dispatch custom event for UI to handle
  window.dispatchEvent(new CustomEvent('sessionWarning', {
    detail: {
      timeRemaining: SESSION_WARNING / 1000,
    },
  }));
}

/**
 * Extend session
 */
export function extendSession(): void {
  if (!sessionData) return;

  const now = Date.now();
  sessionData.lastActivity = now;
  sessionData.expiresAt = now + SESSION_DURATION;

  // Restart timeouts
  startSessionTimeout();
  startSessionWarning();
}

/**
 * Get session data
 */
export function getSession(): SessionData | null {
  return sessionData;
}

/**
 * Check if session is valid
 */
export function isSessionValid(): boolean {
  if (!sessionData) return false;
  return Date.now() < sessionData.expiresAt;
}

/**
 * Get session time remaining
 */
export function getSessionTimeRemaining(): number {
  if (!sessionData) return 0;
  return Math.max(0, sessionData.expiresAt - Date.now());
}

/**
 * End session
 */
export function endSession(): void {
  sessionData = null;
  clearSessionCookie();

  if (sessionTimeout) {
    clearTimeout(sessionTimeout);
    sessionTimeout = null;
  }

  if (warningTimeout) {
    clearTimeout(warningTimeout);
    warningTimeout = null;
  }

  // Dispatch event for UI to handle
  window.dispatchEvent(new CustomEvent('sessionEnded'));
}

/**
 * Refresh session from server
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      extendSession();
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Auto-refresh session on user activity
 */
export function setupActivityTracking(): () => void {
  const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
  ];

  const handleActivity = () => {
    if (isSessionValid()) {
      extendSession();
    }
  };

  activityEvents.forEach(event => {
    window.addEventListener(event, handleActivity);
  });

  // Return cleanup function
  return () => {
    activityEvents.forEach(event => {
      window.removeEventListener(event, handleActivity);
    });
  };
}

/**
 * Check session status periodically
 */
export function startSessionCheck(interval: number = 60000): () => void {
  const intervalId = setInterval(() => {
    if (!isSessionValid()) {
      endSession();
    }
  }, interval);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
  };
}

/**
 * Get session info for display
 */
export function getSessionInfo(): {
  isActive: boolean;
  timeRemaining: number;
  createdAt: Date;
  lastActivity: Date;
} | null {
  if (!sessionData) return null;

  return {
    isActive: isSessionValid(),
    timeRemaining: getSessionTimeRemaining(),
    createdAt: new Date(sessionData.createdAt),
    lastActivity: new Date(sessionData.lastActivity),
  };
}

/**
 * Validate session on page load
 */
export async function validateSessionOnLoad(): Promise<boolean> {
  const sessionId = getSessionId();
  
  if (!sessionId) {
    return false;
  }

  try {
    const response = await fetch('/api/auth/validate', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-Session-ID': sessionId,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.session) {
        sessionData = data.session;
        startSessionTimeout();
        startSessionWarning();
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
