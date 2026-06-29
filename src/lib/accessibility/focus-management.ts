/**
 * Accessibility utilities for focus management
 */

/**
 * Trap focus within a container (for modals, dialogs, etc.)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);

  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
}

/**
 * Set focus to element with animation
 */
export function setFocusWithAnimation(element: HTMLElement): void {
  element.style.outline = 'none';
  element.focus();
  
  // Add focus animation
  element.animate([
    { outline: '2px solid transparent' },
    { outline: '2px solid #3b82f6' },
    { outline: '2px solid transparent' },
  ], {
    duration: 300,
    iterations: 2,
  });
}

/**
 * Restore focus to previous element
 */
export function restoreFocus(previousElement: HTMLElement | null): void {
  if (previousElement) {
    previousElement.focus();
  }
}

/**
 * Manage focus for modal open/close
 */
export class FocusManager {
  private previousActiveElement: HTMLElement | null = null;
  private cleanup: (() => void) | null = null;

  /**
   * Save current focus and trap focus in container
   */
  activate(container: HTMLElement): void {
    this.previousActiveElement = document.activeElement as HTMLElement;
    this.cleanup = trapFocus(container);
  }

  /**
   * Restore previous focus
   */
  deactivate(): void {
    this.cleanup?.();
    this.cleanup = null;
    
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }
  }
}

/**
 * Skip to main content functionality
 */
export function setupSkipLinks(): void {
  const skipLink = document.querySelector('[href="#main-content"]') as HTMLAnchorElement;
  
  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const mainContent = document.querySelector('#main-content') as HTMLElement;
      if (mainContent) {
        mainContent.setAttribute('tabindex', '-1');
        mainContent.focus();
        setFocusWithAnimation(mainContent);
      }
    });
  }
}

/**
 * Announce changes to screen readers
 */
export function announceToScreenReader(message: string): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Manage focus for interactive elements
 */
export function manageInteractiveFocus(element: HTMLElement): void {
  element.setAttribute('tabindex', '0');
  element.setAttribute('role', 'button');
  
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      element.click();
    }
  });
}

/**
 * Check if element is visible
 */
export function isElementVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0';
}

/**
 * Find first visible focusable element
 */
export function findFirstVisibleFocusable(container: HTMLElement): HTMLElement | null {
  const focusableElements = getFocusableElements(container);
  return focusableElements.find(el => isElementVisible(el)) || null;
}

/**
 * Set focus to first visible element
 */
export function focusFirstVisible(container: HTMLElement): void {
  const firstVisible = findFirstVisibleFocusable(container);
  if (firstVisible) {
    firstVisible.focus();
  }
}
