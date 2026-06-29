/**
 * Mobile responsiveness utilities
 * Provides viewport detection, touch handling, and mobile-specific optimizations
 */

export interface Breakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
}

export const BREAKPOINTS: Breakpoint[] = [
  { name: 'xs', minWidth: 0, maxWidth: 639 },
  { name: 'sm', minWidth: 640, maxWidth: 767 },
  { name: 'md', minWidth: 768, maxWidth: 1023 },
  { name: 'lg', minWidth: 1024, maxWidth: 1279 },
  { name: 'xl', minWidth: 1280, maxWidth: 1535 },
  { name: '2xl', minWidth: 1536 },
];

/**
 * Get current breakpoint
 */
export function getCurrentBreakpoint(): Breakpoint {
  const width = window.innerWidth;
  
  for (let i = BREAKPOINTS.length - 1; i >= 0; i--) {
    const bp = BREAKPOINTS[i];
    if (width >= bp.minWidth && (!bp.maxWidth || width <= bp.maxWidth)) {
      return bp;
    }
  }
  
  return BREAKPOINTS[0];
}

/**
 * Check if current viewport is mobile
 */
export function isMobile(): boolean {
  const width = window.innerWidth;
  return width < 768;
}

/**
 * Check if current viewport is tablet
 */
export function isTablet(): boolean {
  const width = window.innerWidth;
  return width >= 768 && width < 1024;
}

/**
 * Check if current viewport is desktop
 */
export function isDesktop(): boolean {
  const width = window.innerWidth;
  return width >= 1024;
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get viewport dimensions
 */
export function getViewportDimensions(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Get safe area insets (for devices with notches)
 */
export function getSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
  };
}

/**
 * Add viewport meta tag dynamically
 */
export function ensureViewportMetaTag(): void {
  let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    document.head.appendChild(meta);
  }
  
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
}

/**
 * Prevent zoom on double tap for mobile
 */
export function preventDoubleTapZoom(): void {
  let lastTouchEnd = 0;
  
  document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
}

/**
 * Handle orientation change
 */
export function onOrientationChange(
  callback: (orientation: 'portrait' | 'landscape') => void
): () => void {
  const handleOrientation = () => {
    const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    callback(orientation);
  };
  
  window.addEventListener('resize', handleOrientation);
  window.addEventListener('orientationchange', handleOrientation);
  
  // Initial call
  handleOrientation();
  
  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handleOrientation);
    window.removeEventListener('orientationchange', handleOrientation);
  };
}

/**
 * Get current orientation
 */
export function getOrientation(): 'portrait' | 'landscape' {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * Debounce resize events
 */
export function onResizeDebounced(
  callback: () => void,
  delay: number = 250
): () => void {
  let timeoutId: NodeJS.Timeout;
  
  const handler = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
  
  window.addEventListener('resize', handler);
  
  // Return cleanup function
  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener('resize', handler);
  };
}

/**
 * Get responsive value based on breakpoint
 */
export function getResponsiveValue<T>(values: Partial<Record<Breakpoint['name'], T>>, defaultValue: T): T {
  const currentBp = getCurrentBreakpoint();
  
  // Check exact match first
  if (values[currentBp.name] !== undefined) {
    return values[currentBp.name]!;
  }
  
  // Check for larger breakpoints
  for (let i = BREAKPOINTS.length - 1; i >= 0; i--) {
    const bp = BREAKPOINTS[i];
    if (values[bp.name] !== undefined && window.innerWidth >= bp.minWidth) {
      return values[bp.name]!;
    }
  }
  
  return defaultValue;
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: HTMLElement, threshold: number = 0): boolean {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const vertInView = rect.top <= windowHeight * (1 - threshold) && rect.bottom >= windowHeight * threshold;
  const horInView = rect.left <= windowWidth * (1 - threshold) && rect.right >= windowWidth * threshold;
  
  return vertInView && horInView;
}

/**
 * Scroll element into view smoothly
 */
export function scrollIntoView(element: HTMLElement, options: ScrollIntoViewOptions = {}): void {
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    ...options,
  });
}

/**
 * Handle pull-to-refresh prevention
 */
export function preventPullToRefresh(): void {
  let startY = 0;
  let isTouching = false;
  
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      startY = e.touches[0].clientY;
      isTouching = true;
    }
  }, { passive: true });
  
  document.addEventListener('touchmove', (e) => {
    if (isTouching && e.touches.length === 1) {
      const y = e.touches[0].clientY;
      const diff = y - startY;
      
      // Prevent pull-to-refresh when at top of page
      if (window.scrollY === 0 && diff > 0) {
        e.preventDefault();
      }
    }
  }, { passive: false });
  
  document.addEventListener('touchend', () => {
    isTouching = false;
  });
}

/**
 * Get device pixel ratio
 */
export function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1;
}

/**
 * Check if device is high DPI
 */
export function isHighDPI(): boolean {
  return getDevicePixelRatio() >= 2;
}

/**
 * Get optimal font size for device
 */
export function getOptimalFontSize(baseSize: number = 16): number {
  const dpr = getDevicePixelRatio();
  
  if (dpr >= 3) {
    return baseSize * 0.9;
  } else if (dpr >= 2) {
    return baseSize * 0.95;
  }
  
  return baseSize;
}

/**
 * Handle mobile keyboard appearance
 */
export function onKeyboardToggle(
  callback: (visible: boolean, keyboardHeight: number) => void
): () => void {
  const initialHeight = window.innerHeight;
  
  const handleResize = () => {
    const currentHeight = window.innerHeight;
    const diff = initialHeight - currentHeight;
    const isKeyboardVisible = diff > 150; // Threshold for keyboard
    
    callback(isKeyboardVisible, diff);
  };
  
  window.addEventListener('resize', handleResize);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}

/**
 * Prevent iOS bounce effect
 */
export function preventIOSBounce(): void {
  document.body.addEventListener(
    'touchmove',
    (e) => {
      if (e.target === document.body) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
}

/**
 * Add tap highlight color removal
 */
export function removeTapHighlight(): void {
  const style = document.createElement('style');
  style.textContent = `
    * {
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Initialize mobile optimizations
 */
export function initMobileOptimizations(): void {
  ensureViewportMetaTag();
  
  if (isTouchDevice()) {
    preventDoubleTapZoom();
    preventPullToRefresh();
    removeTapHighlight();
  }
  
  // iOS-specific optimizations
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    preventIOSBounce();
  }
}

/**
 * Get mobile-specific classes
 */
export function getMobileClasses(): string {
  const classes: string[] = [];
  
  if (isMobile()) {
    classes.push('is-mobile');
  }
  
  if (isTablet()) {
    classes.push('is-tablet');
  }
  
  if (isDesktop()) {
    classes.push('is-desktop');
  }
  
  if (isTouchDevice()) {
    classes.push('is-touch');
  }
  
  if (isHighDPI()) {
    classes.push('is-high-dpi');
  }
  
  classes.push(`orientation-${getOrientation()}`);
  classes.push(`breakpoint-${getCurrentBreakpoint().name}`);
  
  return classes.join(' ');
}

/**
 * Apply mobile classes to document
 */
export function applyMobileClasses(): void {
  document.documentElement.className = getMobileClasses();
  
  // Update on resize
  onResizeDebounced(() => {
    document.documentElement.className = getMobileClasses();
  });
}
