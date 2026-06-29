/**
 * MIME type validation utilities
 */

export interface MimeTypeValidationResult {
  isValid: boolean;
  mimeType?: string;
  error?: string;
}

/**
 * Common MIME types
 */
export const commonMimeTypes = {
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'image/avif',
  ],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ],
  audio: [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/aac',
    'audio/flac',
  ],
  video: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
  ],
  archives: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
    'application/x-tar',
  ],
};

/**
 * Validate file MIME type
 */
export function validateMimeType(
  file: File,
  allowedTypes: string[]
): MimeTypeValidationResult {
  const mimeType = file.type;

  if (!mimeType) {
    return {
      isValid: false,
      error: 'MIME type not detected',
    };
  }

  if (!allowedTypes.includes(mimeType)) {
    return {
      isValid: false,
      mimeType,
      error: `MIME type ${mimeType} is not allowed`,
    };
  }

  return {
    isValid: true,
    mimeType,
  };
}

/**
 * Validate MIME type by file extension
 */
export function validateMimeTypeByExtension(
  filename: string,
  allowedExtensions: string[]
): MimeTypeValidationResult {
  const extension = filename.split('.').pop()?.toLowerCase();

  if (!extension) {
    return {
      isValid: false,
      error: 'No file extension found',
    };
  }

  if (!allowedExtensions.includes(`.${extension}`)) {
    return {
      isValid: false,
      error: `Extension .${extension} is not allowed`,
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validate MIME type by magic bytes (file signature)
 */
export function validateMimeTypeByMagicBytes(
  file: File,
  expectedMimeTypes: string[]
): Promise<MimeTypeValidationResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);
      const detectedType = detectMimeTypeFromBytes(bytes);

      if (detectedType && expectedMimeTypes.includes(detectedType)) {
        resolve({
          isValid: true,
          mimeType: detectedType,
        });
      } else {
        resolve({
          isValid: false,
          error: detectedType 
            ? `MIME type mismatch: expected ${expectedMimeTypes.join(', ')}, got ${detectedType}`
            : 'Could not detect MIME type from file signature',
        });
      }
    };

    reader.onerror = () => {
      resolve({
        isValid: false,
        error: 'Failed to read file',
      });
    };

    reader.readAsArrayBuffer(file.slice(0, 16)); // Read first 16 bytes
  });
}

/**
 * Detect MIME type from magic bytes
 */
function detectMimeTypeFromBytes(bytes: Uint8Array): string | null {
  const signatures: Record<string, string> = {
    '89504e470d0a1a0a': 'image/png',
    'ffd8ff': 'image/jpeg',
    '47494638': 'image/gif',
    '52494646': 'image/webp',
    '25504446': 'application/pdf',
    '504b0304': 'application/zip',
    '52617221': 'application/x-rar-compressed',
    '377abcaf271c': 'application/x-7z-compressed',
    '1f8b08': 'application/gzip',
  };

  const hex = Array.from(bytes.slice(0, 8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  for (const [signature, mimeType] of Object.entries(signatures)) {
    if (hex.startsWith(signature)) {
      return mimeType;
    }
  }

  return null;
}

/**
 * Comprehensive MIME type validation
 */
export async function validateMimeTypeComprehensive(
  file: File,
  allowedTypes: string[],
  options: {
    checkExtension?: boolean;
    checkMagicBytes?: boolean;
  } = {}
): Promise<MimeTypeValidationResult> {
  const { checkExtension = true, checkMagicBytes = true } = options;

  // Check declared MIME type
  const mimeTypeResult = validateMimeType(file, allowedTypes);
  if (!mimeTypeResult.isValid) {
    return mimeTypeResult;
  }

  // Check extension
  if (checkExtension) {
    const extensionResult = validateMimeTypeByExtension(
      file.name,
      allowedTypes.map(type => getExtensionForMimeType(type))
    );
    if (!extensionResult.isValid) {
      return extensionResult;
    }
  }

  // Check magic bytes
  if (checkMagicBytes) {
    const magicBytesResult = await validateMimeTypeByMagicBytes(file, allowedTypes);
    if (!magicBytesResult.isValid) {
      return magicBytesResult;
    }
  }

  return {
    isValid: true,
    mimeType: file.type,
  };
}

/**
 * Get file extension for MIME type
 */
function getExtensionForMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'application/zip': '.zip',
    'text/plain': '.txt',
    'text/csv': '.csv',
  };

  return extensions[mimeType] || '';
}

/**
 * Validate content type header
 */
export function validateContentTypeHeader(
  contentType: string,
  expectedTypes: string[]
): MimeTypeValidationResult {
  const mimeType = contentType.split(';')[0].trim();

  if (!expectedTypes.includes(mimeType)) {
    return {
      isValid: false,
      error: `Content type ${mimeType} is not allowed`,
    };
  }

  return {
    isValid: true,
    mimeType,
  };
}

/**
 * Sanitize MIME type string
 */
export function sanitizeMimeType(mimeType: string): string {
  return mimeType
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9/+-]/g, '');
}

/**
 * Check if MIME type is safe
 */
export function isSafeMimeType(mimeType: string): boolean {
  const unsafeTypes = [
    'text/html',
    'application/javascript',
    'text/javascript',
    'application/x-javascript',
    'text/x-javascript',
    'application/ecmascript',
    'text/ecmascript',
  ];

  const sanitized = sanitizeMimeType(mimeType);
  return !unsafeTypes.includes(sanitized);
}

/**
 * Get MIME type category
 */
export function getMimeTypeCategory(mimeType: string): string {
  const sanitized = sanitizeMimeType(mimeType);
  const type = sanitized.split('/')[0];

  switch (type) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    case 'text':
      return 'text';
    case 'application':
      return 'application';
    default:
      return 'unknown';
  }
}

/**
 * Validate file size and MIME type
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    checkMagicBytes?: boolean;
  } = {}
): MimeTypeValidationResult {
  const { maxSize, allowedTypes, checkMagicBytes = false } = options;

  // Check file size
  if (maxSize && file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds limit of ${maxSize / 1024 / 1024}MB`,
    };
  }

  // Check MIME type
  if (allowedTypes) {
    const mimeTypeResult = validateMimeType(file, allowedTypes);
    if (!mimeTypeResult.isValid) {
      return mimeTypeResult;
    }
  }

  return {
    isValid: true,
    mimeType: file.type,
  };
}

/**
 * MIME type whitelist helper
 */
export class MimeTypeWhitelist {
  private allowedTypes: Set<string> = new Set();

  constructor(types: string[] = []) {
    types.forEach(type => this.add(type));
  }

  add(type: string): void {
    this.allowedTypes.add(sanitizeMimeType(type));
  }

  remove(type: string): void {
    this.allowedTypes.delete(sanitizeMimeType(type));
  }

  has(type: string): boolean {
    return this.allowedTypes.has(sanitizeMimeType(type));
  }

  getAll(): string[] {
    return Array.from(this.allowedTypes);
  }

  validate(file: File): MimeTypeValidationResult {
    return validateMimeType(file, this.getAll());
  }
}

/**
 * Create common MIME type whitelist
 */
export function createCommonWhitelist(): MimeTypeWhitelist {
  const whitelist = new MimeTypeWhitelist();
  
  // Add images
  commonMimeTypes.images.forEach(type => whitelist.add(type));
  
  // Add documents
  commonMimeTypes.documents.forEach(type => whitelist.add(type));
  
  return whitelist;
}
