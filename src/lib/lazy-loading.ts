/**
 * Lazy loading utilities
 * Provides lazy loading for images, components, and below-fold content
 */

import React from 'react';

export interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
  root?: Element | null;
}

export interface LazyLoadCallback {
  (element: Element): void;
}

/**
 * Lazy loader class using Intersection Observer
 */
export class LazyLoader {
  private observer: IntersectionObserver | null = null;
  private callbacks: Map<Element, LazyLoadCallback> = new Map();

  constructor(options: LazyLoadOptions = {}) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersect.bind(this),
        {
          rootMargin: options.rootMargin || '50px',
          threshold: options.threshold || 0.01,
          root: options.root || null,
        }
      );
    }
  }

  private handleIntersect(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const callback = this.callbacks.get(entry.target);
        if (callback) {
          callback(entry.target);
        }
        this.unobserve(entry.target);
      }
    });
  }

  observe(element: Element, callback: LazyLoadCallback): void {
    if (this.observer) {
      this.callbacks.set(element, callback);
      this.observer.observe(element);
    } else {
      // Fallback for browsers without Intersection Observer
      callback(element);
    }
  }

  unobserve(element: Element): void {
    if (this.observer) {
      this.observer.unobserve(element);
      this.callbacks.delete(element);
    }
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.callbacks.clear();
    }
  }
}

export const lazyLoader = new LazyLoader();

/**
 * Lazy load image
 */
export function lazyLoadImage(
  imgElement: HTMLImageElement,
  src: string,
  placeholder?: string
): void {
  if (placeholder) {
    imgElement.src = placeholder;
  }

  lazyLoader.observe(imgElement, (element) => {
    const img = element as HTMLImageElement;
    const tempImg = new Image();
    
    tempImg.onload = () => {
      img.src = src;
      img.classList.add('loaded');
    };
    
    tempImg.onerror = () => {
      img.classList.add('error');
    };
    
    tempImg.src = src;
  });
}

/**
 * Lazy load background image
 */
export function lazyLoadBackground(
  element: HTMLElement,
  src: string,
  placeholder?: string
): void {
  if (placeholder) {
    element.style.backgroundImage = `url(${placeholder})`;
  }

  lazyLoader.observe(element, (el) => {
    const htmlElement = el as HTMLElement;
    const tempImg = new Image();
    
    tempImg.onload = () => {
      htmlElement.style.backgroundImage = `url(${src})`;
      htmlElement.classList.add('loaded');
    };
    
    tempImg.onerror = () => {
      htmlElement.classList.add('error');
    };
    
    tempImg.src = src;
  });
}

/**
 * Lazy load iframe
 */
export function lazyLoadIframe(
  iframeElement: HTMLIFrameElement,
  src: string
): void {
  lazyLoader.observe(iframeElement, (element) => {
    const iframe = element as HTMLIFrameElement;
    iframe.src = src;
    iframe.classList.add('loaded');
  });
}

/**
 * Lazy load video
 */
export function lazyLoadVideo(
  videoElement: HTMLVideoElement,
  src: string,
  poster?: string
): void {
  if (poster) {
    videoElement.poster = poster;
  }

  lazyLoader.observe(videoElement, (element) => {
    const video = element as HTMLVideoElement;
    video.src = src;
    video.classList.add('loaded');
    video.load();
  });
}

/**
 * Lazy load script
 */
export function lazyLoadScript(
  src: string,
  options: {
    async?: boolean;
    defer?: boolean;
    id?: string;
    onLoad?: () => void;
    onError?: () => void;
  } = {}
): void {
  const { async = true, defer = false, id, onLoad, onError } = options;

  lazyLoader.observe(document.body, () => {
    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.defer = defer;
    
    if (id) {
      script.id = id;
    }
    
    if (onLoad) {
      script.onload = onLoad;
    }
    
    if (onError) {
      script.onerror = onError;
    }
    
    document.head.appendChild(script);
  });
}

/**
 * Lazy load CSS
 */
export function lazyLoadCSS(
  href: string,
  options: {
    id?: string;
    media?: string;
    onLoad?: () => void;
    onError?: () => void;
  } = {}
): void {
  const { id, media = 'all', onLoad, onError } = options;

  lazyLoader.observe(document.body, () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = media;
    
    if (id) {
      link.id = id;
    }
    
    if (onLoad) {
      link.onload = onLoad;
    }
    
    if (onError) {
      link.onerror = onError;
    }
    
    document.head.appendChild(link);
  });
}

/**
 * Lazy load component (React)
 */
export function lazyLoadComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    fallback?: React.ReactNode;
    loadingComponent?: React.ComponentType;
    errorComponent?: React.ComponentType<{ error: Error }>;
  } = {}
): React.LazyExoticComponent<T> {
  return React.lazy(() => importFn());
}

/**
 * Prefetch resource
 */
export function prefetchResource(url: string, type: 'script' | 'style' | 'image' | 'font'): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;

  switch (type) {
    case 'script':
      link.as = 'script';
      break;
    case 'style':
      link.as = 'style';
      break;
    case 'image':
      link.as = 'image';
      break;
    case 'font':
      link.as = 'font';
      link.crossOrigin = 'anonymous';
      break;
  }

  document.head.appendChild(link);
}

/**
 * Preload resource
 */
export function preloadResource(url: string, type: 'script' | 'style' | 'image' | 'font'): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;

  switch (type) {
    case 'script':
      link.as = 'script';
      break;
    case 'style':
      link.as = 'style';
      break;
    case 'image':
      link.as = 'image';
      break;
    case 'font':
      link.as = 'font';
      link.crossOrigin = 'anonymous';
      break;
  }

  document.head.appendChild(link);
}

/**
 * Initialize lazy loading for all images with data-src attribute
 */
export function initLazyLoadingImages(): void {
  const images = document.querySelectorAll('img[data-src]');
  images.forEach(img => {
    const element = img as HTMLImageElement;
    const src = element.getAttribute('data-src');
    const placeholder = element.getAttribute('data-placeholder') || undefined;
    
    if (src) {
      lazyLoadImage(element, src, placeholder);
    }
  });
}

/**
 * Initialize lazy loading for all elements with data-bg attribute
 */
export function initLazyLoadingBackgrounds(): void {
  const elements = document.querySelectorAll('[data-bg]');
  elements.forEach(el => {
    const element = el as HTMLElement;
    const src = element.getAttribute('data-bg');
    const placeholder = element.getAttribute('data-placeholder') || undefined;
    
    if (src) {
      lazyLoadBackground(element, src, placeholder);
    }
  });
}

/**
 * Initialize lazy loading for all iframes with data-src attribute
 */
export function initLazyLoadingIframes(): void {
  const iframes = document.querySelectorAll('iframe[data-src]');
  iframes.forEach(iframe => {
    const element = iframe as HTMLIFrameElement;
    const src = element.getAttribute('data-src');
    
    if (src) {
      lazyLoadIframe(element, src);
    }
  });
}

/**
 * Initialize all lazy loading
 */
export function initLazyLoading(): void {
  initLazyLoadingImages();
  initLazyLoadingBackgrounds();
  initLazyLoadingIframes();
}

/**
 * Priority-based lazy loading
 */
export class PriorityLazyLoader {
  private highPriority: LazyLoader;
  private mediumPriority: LazyLoader;
  private lowPriority: LazyLoader;

  constructor() {
    this.highPriority = new LazyLoader({ rootMargin: '100px', threshold: 0.1 });
    this.mediumPriority = new LazyLoader({ rootMargin: '50px', threshold: 0.05 });
    this.lowPriority = new LazyLoader({ rootMargin: '200px', threshold: 0.01 });
  }

  observe(
    element: Element,
    callback: LazyLoadCallback,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): void {
    switch (priority) {
      case 'high':
        this.highPriority.observe(element, callback);
        break;
      case 'medium':
        this.mediumPriority.observe(element, callback);
        break;
      case 'low':
        this.lowPriority.observe(element, callback);
        break;
    }
  }

  disconnect(): void {
    this.highPriority.disconnect();
    this.mediumPriority.disconnect();
    this.lowPriority.disconnect();
  }
}

export const priorityLazyLoader = new PriorityLazyLoader();

/**
 * Lazy load with retry
 */
export function lazyLoadWithRetry(
  loadFn: () => Promise<void>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const attempt = () => {
      attempts++;
      loadFn()
        .then(resolve)
        .catch((error) => {
          if (attempts < maxRetries) {
            setTimeout(attempt, delay * attempts);
          } else {
            reject(error);
          }
        });
    };

    attempt();
  });
}

/**
 * Lazy load with timeout
 */
export function lazyLoadWithTimeout(
  loadFn: () => Promise<void>,
  timeout: number = 5000
): Promise<void> {
  return Promise.race([
    loadFn(),
    new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('Lazy load timeout')), timeout)
    ),
  ]);
}
