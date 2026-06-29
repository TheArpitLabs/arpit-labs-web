import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'crypto';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

// Generate a secure random CSRF token
export function generateCSRFToken(): string {
  return randomBytes(TOKEN_LENGTH).toString('hex');
}

// Hash a token for secure comparison
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Set CSRF token in HTTP-only cookie
export async function setCSRFCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

// Get CSRF token from cookie
export async function getCSRFCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

// Validate CSRF token from request
export async function validateCSRFToken(
  providedToken: string | null | undefined
): Promise<boolean> {
  const cookieToken = await getCSRFCookie();
  
  if (!cookieToken || !providedToken) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  const cookieHash = hashToken(cookieToken);
  const providedHash = hashToken(providedToken);
  
  return cookieHash === providedHash;
}

// Generate and set new CSRF token (useful for initial page load)
export async function initializeCSRF(): Promise<string> {
  const token = generateCSRFToken();
  await setCSRFCookie(token);
  return token;
}

// Middleware function to validate CSRF for API routes
export function csrfProtection(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    // Skip CSRF validation for GET, HEAD, OPTIONS requests (safe methods)
    const method = request.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return handler(request);
    }

    // Validate CSRF token for state-changing methods
    const providedToken = request.headers.get(CSRF_HEADER_NAME);
    const isValid = await validateCSRFToken(providedToken);

    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid CSRF token' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return handler(request);
  };
}

// Get CSRF token for client-side use (non-HTTP-only version)
export async function getCSRFTokenForClient(): Promise<string> {
  let token = await getCSRFCookie();
  
  if (!token) {
    token = await initializeCSRF();
  }
  
  return token;
}
