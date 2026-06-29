/**
 * Keyboard navigation utilities
 */

/**
 * Handle keyboard shortcuts
 */
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  handler: (e: KeyboardEvent) => void;
  description: string;
}

const keyboardShortcuts: Map<string, KeyboardShortcut[]> = new Map();

/**
 * Register a keyboard shortcut
 */
export function registerShortcut(shortcut: KeyboardShortcut): () => void {
  const key = shortcut.key.toLowerCase();
  
  if (!keyboardShortcuts.has(key)) {
    keyboardShortcuts.set(key, []);
  }
  
  keyboardShortcuts.get(key)!.push(shortcut);
  
  // Return cleanup function
  return () => {
    const shortcuts = keyboardShortcuts.get(key);
    if (shortcuts) {
      const index = shortcuts.indexOf(shortcut);
      if (index > -1) {
        shortcuts.splice(index, 1);
      }
    }
  };
}

/**
 * Handle keyboard events
 */
export function handleKeyboardEvent(e: KeyboardEvent): void {
  const key = e.key.toLowerCase();
  const shortcuts = keyboardShortcuts.get(key);
  
  if (!shortcuts) return;
  
  for (const shortcut of shortcuts) {
    if (
      (shortcut.ctrlKey === undefined || shortcut.ctrlKey === e.ctrlKey) &&
      (shortcut.shiftKey === undefined || shortcut.shiftKey === e.shiftKey) &&
      (shortcut.altKey === undefined || shortcut.altKey === e.altKey) &&
      (shortcut.metaKey === undefined || shortcut.metaKey === e.metaKey)
    ) {
      e.preventDefault();
      shortcut.handler(e);
      return;
    }
  }
}

/**
 * Setup global keyboard navigation
 */
export function setupKeyboardNavigation(): () => void {
  document.addEventListener('keydown', handleKeyboardEvent);
  
  // Register common shortcuts
  const cleanupFunctions = [
    registerShortcut({
      key: '/',
      handler: () => {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search"]') as HTMLInputElement;
        searchInput?.focus();
      },
      description: 'Focus search',
    }),
    registerShortcut({
      key: 'Escape',
      handler: () => {
        // Close modals, dropdowns, etc.
        const activeModal = document.querySelector('[role="dialog"]') as HTMLElement;
        if (activeModal) {
          const closeButton = activeModal.querySelector('button[aria-label="Close"], button[aria-label="close"]') as HTMLButtonElement;
          closeButton?.click();
        }
      },
      description: 'Close modal/dropdown',
    }),
  ];
  
  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyboardEvent);
    cleanupFunctions.forEach(cleanup => cleanup());
  };
}

/**
 * Handle arrow key navigation for lists
 */
export function setupArrowKeyNavigation(container: HTMLElement, selector: string): void {
  const items = container.querySelectorAll(selector) as NodeListOf<HTMLElement>;
  
  container.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'Home' && e.key !== 'End') return;
    
    const currentIndex = Array.from(items).findIndex(item => item === document.activeElement);
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      items[prevIndex]?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      items[nextIndex]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  });
}

/**
 * Handle keyboard navigation for tabs
 */
export function setupTabNavigation(container: HTMLElement): void {
  const tabs = container.querySelectorAll('[role="tab"]') as NodeListOf<HTMLElement>;
  
  tabs.forEach((tab, index) => {
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        
        let newIndex: number;
        if (e.key === 'ArrowLeft') {
          newIndex = index > 0 ? index - 1 : tabs.length - 1;
        } else {
          newIndex = index < tabs.length - 1 ? index + 1 : 0;
        }
        
        tabs[newIndex]?.focus();
        tabs[newIndex]?.click();
      }
    });
  });
}

/**
 * Handle keyboard navigation for menus
 */
export function setupMenuNavigation(menu: HTMLElement): void {
  const menuItems = menu.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLElement>;
  
  menu.addEventListener('keydown', (e) => {
    const currentIndex = Array.from(menuItems).findIndex(item => item === document.activeElement);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
      menuItems[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
      menuItems[prevIndex]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      menuItems[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      menuItems[menuItems.length - 1]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      menu.setAttribute('aria-hidden', 'true');
      menu.style.display = 'none';
    }
  });
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animate with reduced motion consideration
 */
export function animateWithReducedMotion(
  element: HTMLElement,
  keyframes: Keyframe[],
  options?: KeyframeAnimationOptions
): Animation | null {
  if (prefersReducedMotion()) {
    return null;
  }
  
  return element.animate(keyframes, options);
}

/**
 * Get all registered shortcuts
 */
export function getRegisteredShortcuts(): KeyboardShortcut[] {
  const allShortcuts: KeyboardShortcut[] = [];
  
  keyboardShortcuts.forEach(shortcuts => {
    allShortcuts.push(...shortcuts);
  });
  
  return allShortcuts;
}
