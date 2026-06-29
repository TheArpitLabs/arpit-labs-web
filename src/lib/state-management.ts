/**
 * State management utilities
 * Provides a simple, reactive state management solution for the application
 */

import React from 'react';

export type StateListener<T> = (state: T) => void;
export type StateSelector<T, U> = (state: T) => U;

/**
 * Base Store class for state management
 */
export class Store<T> {
  private state: T;
  private listeners: Set<StateListener<T>> = new Set();
  private middleware: Array<(state: T, nextState: T) => T> = [];

  constructor(initialState: T) {
    this.state = initialState;
  }

  /**
   * Get current state
   */
  getState(): T {
    return this.state;
  }

  /**
   * Update state
   */
  setState(partial: Partial<T> | ((state: T) => Partial<T>)): void {
    const nextState = typeof partial === 'function'
      ? { ...this.state, ...partial(this.state) }
      : { ...this.state, ...partial };

    // Apply middleware
    let finalState = nextState;
    for (const middleware of this.middleware) {
      finalState = middleware(this.state, finalState);
    }

    this.state = finalState;
    this.notify();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateListener<T>): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Select specific part of state
   */
  select<U>(selector: StateSelector<T, U>): U {
    return selector(this.state);
  }

  /**
   * Add middleware
   */
  use(middleware: (state: T, nextState: T) => T): void {
    this.middleware.push(middleware);
  }

  /**
   * Reset state to initial value
   */
  reset(initialState: T): void {
    this.state = initialState;
    this.notify();
  }

  /**
   * Notify all listeners
   */
  private notify(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }
}

/**
 * Global application state
 */
export interface AppState {
  user: {
    isAuthenticated: boolean;
    profile: any;
    preferences: any;
  };
  ui: {
    sidebarOpen: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  learning: {
    currentPath: any;
    progress: number;
    completedSkills: string[];
  };
  projects: {
    favorites: string[];
    recentlyViewed: string[];
  };
  notifications: {
    unread: number;
    items: any[];
  };
}

const initialAppState: AppState = {
  user: {
    isAuthenticated: false,
    profile: null,
    preferences: {},
  },
  ui: {
    sidebarOpen: true,
    theme: 'system',
    language: 'en',
  },
  learning: {
    currentPath: null,
    progress: 0,
    completedSkills: [],
  },
  projects: {
    favorites: [],
    recentlyViewed: [],
  },
  notifications: {
    unread: 0,
    items: [],
  },
};

export const appStore = new Store<AppState>(initialAppState);

/**
 * Action creators for common state updates
 */
export const actions = {
  user: {
    login: (profile: any) => {
      appStore.setState({
        user: { isAuthenticated: true, profile, preferences: {} },
      });
    },
    logout: () => {
      appStore.setState({
        user: { isAuthenticated: false, profile: null, preferences: {} },
      });
    },
    updateProfile: (profile: any) => {
      appStore.setState((state) => ({
        user: { ...state.user, profile },
      }));
    },
    updatePreferences: (preferences: any) => {
      appStore.setState((state) => ({
        user: { ...state.user, preferences },
      }));
    },
  },
  ui: {
    toggleSidebar: () => {
      appStore.setState((state) => ({
        ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen },
      }));
    },
    setTheme: (theme: 'light' | 'dark' | 'system') => {
      appStore.setState((state) => ({
        ui: { ...state.ui, theme },
      }));
    },
    setLanguage: (language: string) => {
      appStore.setState((state) => ({
        ui: { ...state.ui, language },
      }));
    },
  },
  learning: {
    setCurrentPath: (path: any) => {
      appStore.setState((state) => ({
        learning: { ...state.learning, currentPath: path },
      }));
    },
    updateProgress: (progress: number) => {
      appStore.setState((state) => ({
        learning: { ...state.learning, progress },
      }));
    },
    addCompletedSkill: (skillId: string) => {
      appStore.setState((state) => ({
        learning: {
          ...state.learning,
          completedSkills: [...state.learning.completedSkills, skillId],
        },
      }));
    },
  },
  projects: {
    addFavorite: (projectId: string) => {
      appStore.setState((state) => ({
        projects: {
          ...state.projects,
          favorites: [...state.projects.favorites, projectId],
        },
      }));
    },
    removeFavorite: (projectId: string) => {
      appStore.setState((state) => ({
        projects: {
          ...state.projects,
          favorites: state.projects.favorites.filter(id => id !== projectId),
        },
      }));
    },
    addRecentlyViewed: (projectId: string) => {
      appStore.setState((state) => ({
        projects: {
          ...state.projects,
          recentlyViewed: [projectId, ...state.projects.recentlyViewed.slice(0, 9)],
        },
      }));
    },
  },
  notifications: {
    addNotification: (notification: any) => {
      appStore.setState((state) => ({
        notifications: {
          ...state.notifications,
          items: [notification, ...state.notifications.items],
          unread: state.notifications.unread + 1,
        },
      }));
    },
    markAsRead: (notificationId: string) => {
      appStore.setState((state) => ({
        notifications: {
          ...state.notifications,
          items: state.notifications.items.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
          unread: Math.max(0, state.notifications.unread - 1),
        },
      }));
    },
    markAllAsRead: () => {
      appStore.setState((state) => ({
        notifications: {
          ...state.notifications,
          items: state.notifications.items.map(n => ({ ...n, read: true })),
          unread: 0,
        },
      }));
    },
  },
};

/**
 * Persistence middleware for state
 */
export function createPersistenceMiddleware<T>(key: string, storage: Storage = localStorage) {
  return (state: T, nextState: T): T => {
    // Save to storage
    try {
      storage.setItem(key, JSON.stringify(nextState));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
    return nextState;
  };
}

/**
 * Load persisted state
 */
export function loadPersistedState<T>(key: string, storage: Storage = localStorage): T | null {
  try {
    const serialized = storage.getItem(key);
    if (serialized) {
      return JSON.parse(serialized);
    }
  } catch (error) {
    console.error('Failed to load persisted state:', error);
  }
  return null;
}

/**
 * Logger middleware for state changes
 */
export function createLoggerMiddleware<T>() {
  return (state: T, nextState: T): T => {
    if (process.env.NODE_ENV === 'development') {
      console.log('State changed:', {
        from: state,
        to: nextState,
      });
    }
    return nextState;
  };
}

/**
 * Apply middleware to app store
 */
appStore.use(createPersistenceMiddleware('app-state'));
appStore.use(createLoggerMiddleware());

/**
 * Load persisted state on initialization
 */
const persistedState = loadPersistedState<AppState>('app-state');
if (persistedState) {
  appStore.setState(persistedState);
}

/**
 * React hook for using store in components
 */
export function useStore<T, U = T>(
  store: Store<T>,
  selector?: StateSelector<T, U>
): U {
  const [state, setState] = React.useState(() =>
    selector ? selector(store.getState()) : store.getState()
  );

  React.useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(selector ? selector(newState) : newState);
    });
    return unsubscribe;
  }, [store, selector]);

  return state as U;
}

/**
 * React hook for app state
 */
export function useAppState<U = AppState>(selector?: StateSelector<AppState, U>): U {
  return useStore(appStore, selector);
}

/**
 * Create a custom store with specific state shape
 */
export function createStore<T>(initialState: T, options: {
  persist?: boolean;
  persistKey?: string;
  logger?: boolean;
} = {}): Store<T> {
  const store = new Store<T>(initialState);

  if (options.logger) {
    store.use(createLoggerMiddleware<T>());
  }

  if (options.persist && options.persistKey) {
    store.use(createPersistenceMiddleware<T>(options.persistKey));
    
    const persisted = loadPersistedState<T>(options.persistKey);
    if (persisted) {
      store.setState(persisted);
    }
  }

  return store;
}

/**
 * State selector utilities
 */
export const selectors = {
  user: {
    isAuthenticated: (state: AppState) => state.user.isAuthenticated,
    profile: (state: AppState) => state.user.profile,
    preferences: (state: AppState) => state.user.preferences,
  },
  ui: {
    sidebarOpen: (state: AppState) => state.ui.sidebarOpen,
    theme: (state: AppState) => state.ui.theme,
    language: (state: AppState) => state.ui.language,
  },
  learning: {
    currentPath: (state: AppState) => state.learning.currentPath,
    progress: (state: AppState) => state.learning.progress,
    completedSkills: (state: AppState) => state.learning.completedSkills,
  },
  projects: {
    favorites: (state: AppState) => state.projects.favorites,
    recentlyViewed: (state: AppState) => state.projects.recentlyViewed,
  },
  notifications: {
    unread: (state: AppState) => state.notifications.unread,
    items: (state: AppState) => state.notifications.items,
  },
};

/**
 * Devtools integration for state debugging
 */
export function setupDevTools(store: Store<any>, name: string = 'Store'): void {
  if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
    const devtools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({ name });
    
    devtools.init(store.getState());
    
    store.subscribe((state) => {
      devtools.send('STATE_UPDATE', state);
    });
    
    devtools.subscribe((message: any) => {
      if (message.type === 'DISPATCH' && message.payload) {
        if (message.payload.type === 'JUMP_TO_ACTION' || message.payload.type === 'JUMP_TO_STATE') {
          store.setState(message.payload.state);
        }
      }
    });
  }
}

// Setup devtools for app store in development
if (process.env.NODE_ENV === 'development') {
  setupDevTools(appStore, 'AppStore');
}
