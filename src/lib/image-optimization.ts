import { UPLOAD_CONFIG } from "@/constants/constants";

/**
 * Image optimization utilities for the application
 * Provides functions for optimizing, resizing, and processing images
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

/**
 * Generate optimized image URL for Next.js Image component
 */
export function getOptimizedImageUrl(
  src: string,
  options: ImageOptimizationOptions = {}
): string {
  const { width, height, quality = 80, format = 'webp' } = options;
  
  // If it's already a remote URL, return as-is (Next.js will handle optimization)
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // For local images, append query parameters for optimization
  const params = new URLSearchParams();
  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  params.append('q', quality.toString());
  params.append('f', format);
  
  const queryString = params.toString();
  return queryString ? `${src}?${queryString}` : src;
}

/**
 * Calculate aspect ratio from dimensions
 */
export function getAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * Calculate responsive image sizes
 */
export function getResponsiveSizes(
  baseWidth: number,
  breakpoints: number[] = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
): string {
  const sizes = breakpoints
    .filter(bp => bp >= baseWidth)
    .map(bp => `(max-width: ${bp}px) ${bp}px`)
    .join(', ');
  
  return `${sizes}, ${baseWidth}px`;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  src: string,
  widths: number[],
  options: ImageOptimizationOptions = {}
): string {
  return widths
    .map(width => {
      const optimizedUrl = getOptimizedImageUrl(src, { ...options, width });
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * Validate image file type
 */
export function isValidImageType(mimeType: string): boolean {
  return UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.includes(mimeType as any);
}

/**
 * Validate image file size
 */
export function isValidImageSize(size: number): boolean {
  return size <= UPLOAD_CONFIG.MAX_FILE_SIZE;
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Generate placeholder image URL (using a service like placeholder.com or similar)
 */
export function getPlaceholderUrl(width: number, height: number, text?: string): string {
  const baseUrl = 'https://via.placeholder.com';
  const encodedText = text ? encodeURIComponent(text) : 'Image';
  return `${baseUrl}/${width}x${height}?text=${encodedText}`;
}

/**
 * Generate blur placeholder data URL for Next.js Image component
 */
export function generateBlurPlaceholder(width: number, height: number): string {
  // Generate a simple SVG blur placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Calculate optimal image quality based on device pixel ratio
 */
export function getOptimalQuality(pixelRatio: number = window?.devicePixelRatio || 1): number {
  // Lower quality for high pixel ratios to save bandwidth
  if (pixelRatio >= 3) return 60;
  if (pixelRatio >= 2) return 70;
  return 80;
}

/**
 * Determine if image should be lazy loaded based on viewport
 */
export function shouldLazyLoad(element: HTMLElement): boolean {
  if (!element) return true;
  
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  
  // Load if image is within 2 viewport heights
  return rect.top > windowHeight * 2;
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, options: ImageOptimizationOptions = {}): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = getOptimizedImageUrl(src, options);
  
  document.head.appendChild(link);
}

/**
 * Get image format from MIME type
 */
export function getImageFormat(mimeType: string): string {
  const formatMap: Record<string, string> = {
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpeg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
  };
  
  return formatMap[mimeType] || 'jpeg';
}

/**
 * Check if browser supports next-gen image formats
 */
export function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

export function supportsAVIF(): boolean {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
}

/**
 * Get best supported image format for current browser
 */
export function getBestSupportedFormat(): 'webp' | 'avif' | 'jpeg' {
  if (supportsAVIF()) return 'avif';
  if (supportsWebP()) return 'webp';
  return 'jpeg';
}
