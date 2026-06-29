/**
 * SSRF (Server-Side Request Forgery) Protection
 * Prevents unauthorized requests to internal resources
 */

/**
 * Validates if a URL is safe to make requests to
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Block private IP ranges
    if (isPrivateIP(parsed.hostname)) {
      return false;
    }
    
    // Block localhost
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return false;
    }
    
    // Block metadata endpoints (AWS, GCP, Azure)
    if (isMetadataEndpoint(url)) {
      return false;
    }
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    
    // Block internal hostnames
    if (isInternalHostname(parsed.hostname)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if an IP address is in a private range
 */
function isPrivateIP(hostname: string): boolean {
  const ipPatterns = [
    /^10\./, // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./, // 192.168.0.0/16
    /^127\./, // 127.0.0.0/8
    /^169\.254\./, // 169.254.0.0/16
    /^::1$/, // IPv6 localhost
    /^fc00:/i, // IPv6 unique local
    /^fe80:/i, // IPv6 link-local
  ];
  
  return ipPatterns.some(pattern => pattern.test(hostname));
}

/**
 * Checks if URL is a cloud metadata endpoint
 */
function isMetadataEndpoint(url: string): boolean {
  const metadataPatterns = [
    'metadata.google.internal',
    '169.254.169.254',
    'metadata.azure.com',
    '169.254.169.254/latest/meta-data',
    '169.254.169.254/metadata',
  ];
  
  return metadataPatterns.some(pattern => url.includes(pattern));
}

/**
 * Checks if hostname is internal
 */
function isInternalHostname(hostname: string): boolean {
  const internalPatterns = [
    'internal',
    'intranet',
    'private',
    'local',
    'localhost',
  ];
  
  const lowerHostname = hostname.toLowerCase();
  return internalPatterns.some(pattern => lowerHostname.includes(pattern));
}

/**
 * Sanitizes a URL for safe use
 */
export function sanitizeUrl(url: string): string | null {
  if (!isSafeUrl(url)) {
    return null;
  }
  
  try {
    const parsed = new URL(url);
    
    // Remove credentials from URL
    parsed.username = '';
    parsed.password = '';
    
    // Remove fragment
    parsed.hash = '';
    
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validates and sanitizes a list of URLs
 */
export function validateUrls(urls: string[]): string[] {
  return urls
    .map(url => sanitizeUrl(url))
    .filter((url): url is string => url !== null);
}

/**
 * DNS rebinding protection
 */
export class DNSRebindingProtection {
  private resolvedIPs = new Map<string, string[]>();
  private readonly maxResolutions = 3;
  
  /**
   * Checks if a hostname has been resolved to multiple IPs (potential rebinding)
   */
  async checkRebinding(hostname: string): Promise<boolean> {
    const previousIPs = this.resolvedIPs.get(hostname);
    
    // In a real implementation, you would resolve the hostname here
    // For now, this is a placeholder
    const currentIPs: string[] = [];
    
    if (previousIPs && previousIPs.length > 0) {
      // Check if IPs have changed
      const hasChanged = currentIPs.some(ip => !previousIPs.includes(ip));
      
      if (hasChanged && previousIPs.length >= this.maxResolutions) {
        return true;
      }
    }
    
    this.resolvedIPs.set(hostname, [...(previousIPs || []), ...currentIPs]);
    return false;
  }
  
  /**
   * Clears the resolution history for a hostname
   */
  clearHistory(hostname: string): void {
    this.resolvedIPs.delete(hostname);
  }
  
  /**
   * Clears all resolution history
   */
  clearAllHistory(): void {
    this.resolvedIPs.clear();
  }
}

/**
 * Creates a safe fetch wrapper with SSRF protection
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  const sanitizedUrl = sanitizeUrl(url);
  
  if (!sanitizedUrl) {
    throw new Error('URL is not safe to fetch');
  }
  
  return fetch(sanitizedUrl, options);
}

/**
 * Validates redirect URLs
 */
export function isSafeRedirect(url: string, allowedDomains: string[]): boolean {
  try {
    const parsed = new URL(url);
    
    // Check if URL is safe
    if (!isSafeUrl(url)) {
      return false;
    }
    
    // Check if domain is in allowed list
    if (allowedDomains.length > 0) {
      return allowedDomains.some(domain => 
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      );
    }
    
    return true;
  } catch {
    return false;
  }
}
