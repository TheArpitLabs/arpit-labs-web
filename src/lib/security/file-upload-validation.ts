/**
 * File Upload Validation
 * Validates file uploads for security and compliance
 */

/**
 * Allowed file types for upload
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
] as const;

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  default: 2 * 1024 * 1024, // 2MB
} as const;

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

/**
 * Validates a file upload
 */
export function validateFileUpload(
  file: File,
  options?: {
    allowedMimeTypes?: readonly string[];
    maxSize?: number;
    requireFilename?: boolean;
  }
): FileValidationResult {
  const {
    allowedMimeTypes = ALLOWED_MIME_TYPES,
    maxSize = MAX_FILE_SIZES.default,
    requireFilename = true,
  } = options || {};
  
  // Check if file exists
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }
  
  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${formatBytes(maxSize)}`,
    };
  }
  
  // Check MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }
  
  // Check filename
  if (requireFilename && !file.name) {
    return { isValid: false, error: 'Filename is required' };
  }
  
  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.name);
  
  return {
    isValid: true,
    sanitizedFilename,
  };
}

/**
 * Sanitizes a filename to prevent path traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const sanitized = filename.replace(/^.*[\\\/]/, '');
  
  // Remove null bytes
  const noNulls = sanitized.replace(/\0/g, '');
  
  // Remove control characters
  const noControls = noNulls.replace(/[\x00-\x1f\x7f]/g, '');
  
  // Replace dangerous characters with underscores
  const safeChars = noControls.replace(/[<>:"|?*\x00-\x1f]/g, '_');
  
  // Limit filename length
  const maxLength = 255;
  const truncated = safeChars.slice(0, maxLength);
  
  // Ensure filename is not empty
  if (!truncated) {
    return 'unnamed_file';
  }
  
  return truncated;
}

/**
 * Validates file content by checking magic bytes
 */
export function validateFileContent(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(buffer.slice(0, 12));
      
      // Check magic bytes for common file types
      const isValid = checkMagicBytes(bytes, file.type);
      resolve(isValid);
    };
    
    reader.onerror = () => resolve(false);
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Checks magic bytes against expected file type
 */
function checkMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
  const magicBytes: Record<string, number[]> = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'image/webp': [0x52, 0x49, 0x46, 0x46],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
  };
  
  const expected = magicBytes[mimeType];
  if (!expected) return true; // Allow if no magic bytes defined
  
  for (let i = 0; i < expected.length; i++) {
    if (bytes[i] !== expected[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Scans file for malicious content
 */
export async function scanForMaliciousContent(file: File): Promise<boolean> {
  const text = await file.text();
  
  // Check for script tags in non-HTML files
  if (file.type !== 'text/html' && /<script/i.test(text)) {
    return false;
  }
  
  // Check for PHP tags
  if (/<\?php/i.test(text)) {
    return false;
  }
  
  // Check for shell commands
  if (/exec\(|system\(|passthru\(/i.test(text)) {
    return false;
  }
  
  return true;
}

/**
 * Generates a safe filename with timestamp
 */
export function generateSafeFilename(originalName: string): string {
  const sanitized = sanitizeFilename(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = sanitized.includes('.') 
    ? sanitized.substring(sanitized.lastIndexOf('.'))
    : '';
  const baseName = sanitized.replace(/\.[^/.]+$/, '');
  
  return `${baseName}_${timestamp}_${random}${extension}`;
}

/**
 * Formats bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validates image dimensions
 */
export function validateImageDimensions(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<{ isValid: boolean; width?: number; height?: number; error?: string }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({ isValid: false, error: 'File is not an image' });
      return;
    }
    
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      if (img.width > maxWidth || img.height > maxHeight) {
        resolve({
          isValid: false,
          error: `Image dimensions exceed maximum allowed size of ${maxWidth}x${maxHeight}`,
          width: img.width,
          height: img.height,
        });
      } else {
        resolve({
          isValid: true,
          width: img.width,
          height: img.height,
        });
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ isValid: false, error: 'Failed to load image' });
    };
    
    img.src = url;
  });
}

/**
 * Batch validates multiple files
 */
export async function validateFiles(
  files: File[],
  options?: Parameters<typeof validateFileUpload>[1]
): Promise<{ valid: File[]; invalid: Array<{ file: File; error: string }> }> {
  const valid: File[] = [];
  const invalid: Array<{ file: File; error: string }> = [];
  
  for (const file of files) {
    const result = validateFileUpload(file, options);
    
    if (result.isValid) {
      valid.push(file);
    } else {
      invalid.push({ file, error: result.error || 'Unknown error' });
    }
  }
  
  return { valid, invalid };
}
