/**
 * Real-time Notification Manager
 * Handles real-time notifications using WebSockets or Server-Sent Events
 */

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number; // Auto-dismiss duration in ms
}

export interface NotificationConfig {
  maxNotifications?: number;
  defaultDuration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  sound?: boolean;
}

class NotificationManager {
  private notifications = new Map<string, Notification>();
  private listeners = new Set<(notifications: Notification[]) => void>();
  private config: Required<NotificationConfig>;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(config: NotificationConfig = {}) {
    this.config = {
      maxNotifications: 10,
      defaultDuration: 5000,
      position: 'top-right',
      sound: true,
      ...config,
    };
  }

  /**
   * Adds a notification
   */
  add(notification: Omit<Notification, 'id' | 'timestamp'>): string {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      read: false,
      duration: notification.duration ?? this.config.defaultDuration,
    };

    // Enforce max notifications
    if (this.notifications.size >= this.config.maxNotifications) {
      const oldestId = this.notifications.keys().next().value;
      if (oldestId) {
        this.notifications.delete(oldestId);
      }
    }

    this.notifications.set(id, fullNotification);
    this.notifyListeners();

    // Play sound if enabled
    if (this.config.sound) {
      this.playSound(notification.type);
    }

    //Auto-dismiss after duration
    if (fullNotification.duration && fullNotification.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, fullNotification.duration);
    }

    return id;
  }

  /**
   * Removes a notification
   */
  remove(id: string): void {
    this.notifications.delete(id);
    this.notifyListeners();
  }

  /**
   * Marks a notification as read
   */
  markAsRead(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  /**
   * Marks all notifications as read
   */
  markAllAsRead(): void {
    for (const notification of this.notifications.values()) {
      notification.read = true;
    }
    this.notifyListeners();
  }

  /**
   * Clears all notifications
   */
  clear(): void {
    this.notifications.clear();
    this.notifyListeners();
  }

  /**
   * Gets all notifications
   */
  getAll(): Notification[] {
    return Array.from(this.notifications.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    );
  }

  /**
   * Gets unread notifications
   */
  getUnread(): Notification[] {
    return this.getAll().filter((n) => !n.read);
  }

  /**
   * Gets unread count
   */
  getUnreadCount(): number {
    return this.getUnread().length;
  }

  /**
   * Subscribes to notification changes
   */
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notifies all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getAll()));
  }

  /**
   * Plays notification sound
   */
  private playSound(type: Notification['type']): void {
    const audio = new Audio();
    
    switch (type) {
      case 'success':
        audio.src = '/sounds/success.mp3';
        break;
      case 'error':
        audio.src = '/sounds/error.mp3';
        break;
      case 'warning':
        audio.src = '/sounds/warning.mp3';
        break;
      default:
        audio.src = '/sounds/info.mp3';
    }

    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  }

  /**
   * Connects to WebSocket for real-time notifications
   */
  connectWebSocket(url: string): void {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        this.add(notification);
      } catch (error) {
        console.error('Failed to parse notification:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect(url);
    };
  }

  /**
   * Attempts to reconnect WebSocket
   */
  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000;

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connectWebSocket(url);
    }, delay);
  }

  /**
   * Disconnects WebSocket
   */
  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Updates configuration
   */
  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

/**
 * Adds a notification
 */
export function addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): string {
  return notificationManager.add(notification);
}

/**
 * Removes a notification
 */
export function removeNotification(id: string): void {
  notificationManager.remove(id);
}

/**
 * Marks notification as read
 */
export function markNotificationAsRead(id: string): void {
  notificationManager.markAsRead(id);
}

/**
 * Marks all notifications as read
 */
export function markAllNotificationsAsRead(): void {
  notificationManager.markAllAsRead();
}

/**
 * Clears all notifications
 */
export function clearNotifications(): void {
  notificationManager.clear();
}

/**
 * Gets all notifications
 */
export function getNotifications(): Notification[] {
  return notificationManager.getAll();
}

/**
 * Gets unread notifications
 */
export function getUnreadNotifications(): Notification[] {
  return notificationManager.getUnread();
}

/**
 * Gets unread count
 */
export function getUnreadNotificationCount(): number {
  return notificationManager.getUnreadCount();
}

/**
 * Subscribes to notification changes
 */
export function subscribeToNotifications(
  listener: (notifications: Notification[]) => void
): () => void {
  return notificationManager.subscribe(listener);
}

/**
 * Connects to WebSocket
 */
export function connectNotificationWebSocket(url: string): void {
  notificationManager.connectWebSocket(url);
}

/**
 * Disconnects WebSocket
 */
export function disconnectNotificationWebSocket(): void {
  notificationManager.disconnectWebSocket();
}

/**
 * Updates notification config
 */
export function updateNotificationConfig(config: Partial<NotificationConfig>): void {
  notificationManager.updateConfig(config);
}

export default notificationManager;
