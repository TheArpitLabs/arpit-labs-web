/**
 * Responsive design utilities
 */

export interface Breakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
}

export const breakpoints: Breakpoint[] = [
  { name: 'mobile', minWidth: 0, maxWidth: 639 },
  { name: 'tablet', minWidth: 640, maxWidth: 1023 },
  { name: 'desktop', minWidth: 1024, maxWidth: 1439 },
  { name: 'wide', minWidth: 1440, maxWidth: 1919 },
  { name: 'ultraWide', minWidth: 1920 },
];

/**
 * Get current breakpoint
 */
export function getCurrentBreakpoint(): Breakpoint {
  const width = window.innerWidth;

  for (let i = breakpoints.length - 1; i >= 0; i--) {
    const bp = breakpoints[i];
    if (width >= bp.minWidth && (!bp.maxWidth || width <= bp.maxWidth)) {
      return bp;
    }
  }

  return breakpoints[0];
}

/**
 * Check if current breakpoint matches
 */
export function isBreakpoint(breakpointName: string): boolean {
  return getCurrentBreakpoint().name === breakpointName;
}

/**
 * Check if current breakpoint is at least
 */
export function isMinBreakpoint(breakpointName: string): boolean {
  const current = getCurrentBreakpoint();
  const target = breakpoints.find(bp => bp.name === breakpointName);
  
  if (!target) return false;
  
  return current.minWidth >= target.minWidth;
}

/**
 * Check if current breakpoint is at most
 */
export function isMaxBreakpoint(breakpointName: string): boolean {
  const current = getCurrentBreakpoint();
  const target = breakpoints.find(bp => bp.name === breakpointName);
  
  if (!target) return false;
  
  return target.maxWidth ? current.minWidth <= target.maxWidth : true;
}

/**
 * Get responsive value
 */
export function getResponsiveValue<T>(values: Partial<Record<string, T>>, defaultValue: T): T {
  const current = getCurrentBreakpoint();
  
  // Check for exact match
  if (values[current.name]) {
    return values[current.name] as T;
  }
  
  // Check for smaller breakpoints
  for (let i = breakpoints.length - 1; i >= 0; i--) {
    const bp = breakpoints[i];
    if (current.minWidth >= bp.minWidth && values[bp.name]) {
      return values[bp.name] as T;
    }
  }
  
  return defaultValue;
}

/**
 * Create responsive styles
 */
export function createResponsiveStyles<T extends Record<string, any>>(
  styles: Partial<Record<string, T>>
): T {
  const current = getCurrentBreakpoint();
  
  // Check for exact match
  if (styles[current.name]) {
    return styles[current.name] as T;
  }
  
  // Check for smaller breakpoints
  for (let i = breakpoints.length - 1; i >= 0; i--) {
    const bp = breakpoints[i];
    if (current.minWidth >= bp.minWidth && styles[bp.name]) {
      return styles[bp.name] as T;
    }
  }
  
  // Return first available style
  const firstAvailable = Object.values(styles)[0];
  return firstAvailable as T;
}

/**
 * Listen for breakpoint changes
 */
export function onBreakpointChange(callback: (breakpoint: Breakpoint) => void): () => void {
  let previousBreakpoint = getCurrentBreakpoint();
  
  const handler = () => {
    const currentBreakpoint = getCurrentBreakpoint();
    if (currentBreakpoint.name !== previousBreakpoint.name) {
      previousBreakpoint = currentBreakpoint;
      callback(currentBreakpoint);
    }
  };
  
  window.addEventListener('resize', handler);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handler);
  };
}

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  return isBreakpoint('mobile');
}

/**
 * Check if device is tablet
 */
export function isTablet(): boolean {
  return isBreakpoint('tablet');
}

/**
 * Check if device is desktop
 */
export function isDesktop(): boolean {
  return isMinBreakpoint('desktop');
}

/**
 * Check if device is touch device
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Check if device supports hover
 */
export function supportsHover(): boolean {
  return window.matchMedia('(hover: hover)').matches;
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
 * Get safe area insets
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
 * Check if viewport is in landscape orientation
 */
export function isLandscape(): boolean {
  return window.innerWidth > window.innerHeight;
}

/**
 * Check if viewport is in portrait orientation
 */
export function isPortrait(): boolean {
  return window.innerHeight > window.innerWidth;
}

/**
 * Get viewport dimensions
 */
export function getViewportDimensions(): {
  width: number;
  height: number;
} {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Get viewport safe dimensions (accounting for safe areas)
 */
export function getSafeViewportDimensions(): {
  width: number;
  height: number;
} {
  const insets = getSafeAreaInsets();
  const dimensions = getViewportDimensions();
  
  return {
    width: dimensions.width - insets.left - insets.right,
    height: dimensions.height - insets.top - insets.bottom,
  };
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Check if element is partially in viewport
 */
export function isPartiallyInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  
  return (
    rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
    rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
    rect.bottom > 0 &&
    rect.right > 0
  );
}

/**
 * Get element visibility percentage
 */
export function getVisibilityPercentage(element: HTMLElement): number {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
  const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
  
  const visibleArea = visibleHeight * visibleWidth;
  const totalArea = rect.height * rect.width;
  
  return totalArea > 0 ? (visibleArea / totalArea) * 100 : 0;
}

/**
 * Responsive image source
 */
export function getResponsiveImageSrc(
  baseUrl: string,
  widths: number[],
  format: string = 'webp'
): string {
  const currentWidth = window.innerWidth;
  const bestWidth = widths.reduce((prev, curr) => {
    return Math.abs(curr - currentWidth) < Math.abs(prev - currentWidth) ? curr : prev;
  });
  
  return `${baseUrl}?w=${bestWidth}&f=${format}`;
}

/**
 * Responsive font size
 */
export function getResponsiveFontSize(
  baseSize: number,
  scaleFactor: number = 0.1
): number {
  const breakpoint = getCurrentBreakpoint();
  const multiplier = {
    mobile: 0.8,
    tablet: 0.9,
    desktop: 1,
    wide: 1.1,
    ultraWide: 1.2,
  };
  
  return baseSize * (multiplier[breakpoint.name as keyof typeof multiplier] || 1);
}

/**
 * Responsive spacing
 */
export function getResponsiveSpacing(
  baseSpacing: number,
  scaleFactor: number = 0.2
): number {
  const breakpoint = getCurrentBreakpoint();
  const multiplier = {
    mobile: 0.6,
    tablet: 0.8,
    desktop: 1,
    wide: 1.2,
    ultraWide: 1.4,
  };
  
  return baseSpacing * (multiplier[breakpoint.name as keyof typeof multiplier] || 1);
}

/**
 * Check if prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if prefers dark mode
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Check if prefers light mode
 */
export function prefersLightMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: light)').matches;
}

/**
 * Get preferred color scheme
 */
export function getPreferredColorScheme(): 'light' | 'dark' {
  return prefersDarkMode() ? 'dark' : 'light';
}

/**
 * Listen for color scheme changes
 */
export function onColorSchemeChange(callback: (scheme: 'light' | 'dark') => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };
  
  mediaQuery.addEventListener('change', handler);
  
  // Return cleanup function
  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}

/**
 * Check if prefers high contrast
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Check if prefers reduced data
 */
export function prefersReducedData(): boolean {
  return window.matchMedia('(prefers-reduced-data: reduce)').matches;
}
