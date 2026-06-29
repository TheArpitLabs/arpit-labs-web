import { describe, it, expect } from 'vitest';
import { isSafeUrl, sanitizeUrl, isSafeRedirect } from '@/lib/security/ssrf-protection';
import { validateFileUpload, sanitizeFilename } from '@/lib/security/file-upload-validation';

describe('SSRF Protection', () => {
  it('should block private IP addresses', () => {
    expect(isSafeUrl('http://192.168.1.1')).toBe(false);
    expect(isSafeUrl('http://10.0.0.1')).toBe(false);
    expect(isSafeUrl('http://172.16.0.1')).toBe(false);
  });

  it('should block localhost', () => {
    expect(isSafeUrl('http://localhost')).toBe(false);
    expect(isSafeUrl('http://127.0.0.1')).toBe(false);
  });

  it('should block metadata endpoints', () => {
    expect(isSafeUrl('http://169.254.169.254')).toBe(false);
    expect(isSafeUrl('http://metadata.google.internal')).toBe(false);
  });

  it('should allow safe URLs', () => {
    expect(isSafeUrl('https://example.com')).toBe(true);
    expect(isSafeUrl('https://api.example.com')).toBe(true);
  });

  it('should sanitize URLs', () => {
    expect(sanitizeUrl('https://user:pass@example.com')).toBe('https://example.com');
    expect(sanitizeUrl('https://example.com#section')).toBe('https://example.com');
  });

  it('should validate redirect URLs', () => {
    expect(isSafeRedirect('https://example.com', ['example.com'])).toBe(true);
    expect(isSafeRedirect('https://evil.com', ['example.com'])).toBe(false);
  });
});

describe('File Upload Validation', () => {
  it('should validate allowed MIME types', () => {
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const result = validateFileUpload(file);
    expect(result.isValid).toBe(true);
  });

  it('should reject disallowed MIME types', () => {
    const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
    const result = validateFileUpload(file);
    expect(result.isValid).toBe(false);
  });

  it('should sanitize filenames', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('etc_passwd');
    expect(sanitizeFilename('test<script>.jpg')).toBe('test_script_.jpg');
    expect(sanitizeFilename('test:file.jpg')).toBe('test_file.jpg');
  });

  it('should enforce file size limits', () => {
    const largeFile = new File([new Array(6 * 1024 * 1024).fill('a').join('')], 'large.jpg', { type: 'image/jpeg' });
    const result = validateFileUpload(largeFile, { maxSize: 5 * 1024 * 1024 });
    expect(result.isValid).toBe(false);
  });
});
