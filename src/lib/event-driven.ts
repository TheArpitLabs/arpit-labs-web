/**
 * Event-driven architecture utilities
 * Provides event bus, pub/sub pattern, and event handlers for decoupled components
 */

export type EventHandler<T = any> = (data: T) => void | Promise<void>;

export interface EventSubscription {
  unsubscribe: () => void;
}

export interface EventOptions {
  once?: boolean;
  priority?: number;
}

/**
 * Event Bus for pub/sub pattern
 */
export class EventBus {
  private listeners: Map<string, Array<{ handler: EventHandler; priority: number }>> = new Map();
  private onceListeners: Map<string, EventHandler[]> = new Map();

  /**
   * Subscribe to an event
   */
  on<T = any>(event: string, handler: EventHandler<T>, options: EventOptions = {}): EventSubscription {
    const { once = false, priority = 0 } = options;

    if (once) {
      if (!this.onceListeners.has(event)) {
        this.onceListeners.set(event, []);
      }
      this.onceListeners.get(event)!.push(handler);
    } else {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event)!.push({ handler, priority });
      
      // Sort by priority (higher priority first)
      this.listeners.get(event)!.sort((a, b) => b.priority - a.priority);
    }

    return {
      unsubscribe: () => this.off(event, handler),
    };
  }

  /**
   * Unsubscribe from an event
   */
  off<T = any>(event: string, handler: EventHandler<T>): void {
    // Regular listeners
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.findIndex(l => l.handler === handler);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }

    // Once listeners
    const onceListeners = this.onceListeners.get(event);
    if (onceListeners) {
      const index = onceListeners.indexOf(handler);
      if (index !== -1) {
        onceListeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event
   */
  async emit<T = any>(event: string, data?: T): Promise<void> {
    // Handle regular listeners
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const { handler } of listeners) {
        try {
          await handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      }
    }

    // Handle once listeners
    const onceListeners = this.onceListeners.get(event);
    if (onceListeners) {
      for (const handler of onceListeners) {
        try {
          await handler(data);
        } catch (error) {
          console.error(`Error in once event handler for ${event}:`, error);
        }
      }
      // Clear once listeners after execution
      this.onceListeners.delete(event);
    }
  }

  /**
   * Subscribe to event once
   */
  once<T = any>(event: string, handler: EventHandler<T>): EventSubscription {
    return this.on(event, handler, { once: true });
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: string): number {
    const regular = this.listeners.get(event)?.length || 0;
    const once = this.onceListeners.get(event)?.length || 0;
    return regular + once;
  }

  /**
   * Get all event names
   */
  eventNames(): string[] {
    const names = new Set([
      ...this.listeners.keys(),
      ...this.onceListeners.keys(),
    ]);
    return Array.from(names);
  }
}

// Global event bus instance
export const eventBus = new EventBus();

/**
 * Event types for the application
 */
export enum EventType {
  // User events
  USER_LOGIN = 'user:login',
  USER_LOGOUT = 'user:logout',
  USER_REGISTER = 'user:register',
  USER_UPDATE = 'user:update',
  
  // Project events
  PROJECT_CREATE = 'project:create',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  PROJECT_VIEW = 'project:view',
  
  // Learning events
  LEARNING_START = 'learning:start',
  LEARNING_COMPLETE = 'learning:complete',
  LEARNING_PROGRESS = 'learning:progress',
  
  // Admin events
  ADMIN_ACTION = 'admin:action',
  ADMIN_APPROVE = 'admin:approve',
  ADMIN_REJECT = 'admin:reject',
  
  // System events
  SYSTEM_ERROR = 'system:error',
  SYSTEM_WARNING = 'system:warning',
  SYSTEM_READY = 'system:ready',
  
  // Network events
  NETWORK_ONLINE = 'network:online',
  NETWORK_OFFLINE = 'network:offline',
  
  // Cache events
  CACHE_HIT = 'cache:hit',
  CACHE_MISS = 'cache:miss',
  CACHE_INVALIDATE = 'cache:invalidate',
}

/**
 * Domain event base class
 */
export abstract class DomainEvent {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly type: string;

  constructor(type: string) {
    this.id = crypto.randomUUID();
    this.timestamp = Date.now();
    this.type = type;
  }
}

/**
 * Event store for persistence
 */
export class EventStore {
  private events: DomainEvent[] = [];
  private maxEvents: number = 1000;

  constructor(maxEvents: number = 1000) {
    this.maxEvents = maxEvents;
  }

  append(event: DomainEvent): void {
    this.events.push(event);
    
    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  getEvents(type?: string): DomainEvent[] {
    if (type) {
      return this.events.filter(e => e.type === type);
    }
    return [...this.events];
  }

  getEventsSince(timestamp: number): DomainEvent[] {
    return this.events.filter(e => e.timestamp >= timestamp);
  }

  clear(): void {
    this.events = [];
  }

  getCount(): number {
    return this.events.length;
  }
}

export const eventStore = new EventStore();

/**
 * Event decorator for automatic event publishing
 */
export function PublishEvent(eventType: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      // Publish event after method execution
      await eventBus.emit(eventType, {
        method: propertyKey,
        args,
        result,
        timestamp: Date.now(),
      });
      
      return result;
    };

    return descriptor;
  };
}

/**
 * Event handler decorator
 */
export function HandleEvent(eventType: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    // Subscribe to event when class is instantiated
    const originalConstructor = target.constructor;

    target.constructor = function (...args: any[]) {
      const instance = new (originalConstructor as any)(...args);
      
      eventBus.on(eventType, (data) => {
        originalMethod.call(instance, data);
      });
      
      return instance;
    };

    return descriptor;
  };
}

/**
 * Event aggregator for multiple event buses
 */
export class EventAggregator {
  private buses: Map<string, EventBus> = new Map();

  registerBus(name: string, bus: EventBus): void {
    this.buses.set(name, bus);
  }

  getBus(name: string): EventBus | undefined {
    return this.buses.get(name);
  }

  async emitToAll(event: string, data?: any): Promise<void> {
    const promises = Array.from(this.buses.values()).map(bus => bus.emit(event, data));
    await Promise.all(promises);
  }

  async emitToBus(busName: string, event: string, data?: any): Promise<void> {
    const bus = this.buses.get(busName);
    if (bus) {
      await bus.emit(event, data);
    }
  }
}

export const eventAggregator = new EventAggregator();
eventAggregator.registerBus('global', eventBus);

/**
 * Event replay utility
 */
export class EventReplayer {
  constructor(private eventStore: EventStore) {}

  async replay(eventType: string, fromTimestamp?: number): Promise<void> {
    const events = fromTimestamp
      ? this.eventStore.getEventsSince(fromTimestamp)
      : this.eventStore.getEvents(eventType);

    for (const event of events) {
      await eventBus.emit(event.type, event);
    }
  }
}

export const eventReplayer = new EventReplayer(eventStore);

/**
 * Event middleware
 */
export type EventMiddleware = (
  event: string,
  data: any,
  next: () => Promise<void>
) => Promise<void>;

export class EventMiddlewarePipeline {
  private middlewares: EventMiddleware[] = [];

  use(middleware: EventMiddleware): void {
    this.middlewares.push(middleware);
  }

  async execute(event: string, data: any): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        await middleware(event, data, next);
      }
    };

    await next();
  }
}

export const eventMiddleware = new EventMiddlewarePipeline();

/**
 * Logging middleware for events
 */
eventMiddleware.use(async (event, data, next) => {
  console.log(`[Event] ${event}`, data);
  await next();
});

/**
 * Error handling middleware for events
 */
eventMiddleware.use(async (event, data, next) => {
  try {
    await next();
  } catch (error) {
    console.error(`[Event Error] ${event}`, error);
    await eventBus.emit(EventType.SYSTEM_ERROR, { event, error });
  }
});

/**
 * Enhanced emit with middleware
 */
export async function emitWithMiddleware<T = any>(event: string, data?: T): Promise<void> {
  await eventMiddleware.execute(event, data);
  await eventBus.emit(event, data);
}
