/**
 * API Version Negotiation
 * Handles API version negotiation via headers and URL
 */

export interface VersionConfig {
  defaultVersion: string;
  supportedVersions: string[];
  deprecatedVersions?: string[];
  sunsetVersions?: Record<string, string>; // version -> sunset date
}

export interface VersionInfo {
  version: string;
  isDeprecated: boolean;
  sunsetDate?: string;
  supported: boolean;
}

class VersionNegotiator {
  private config: VersionConfig;

  constructor(config: VersionConfig) {
    this.config = config;
  }

  /**
   * Extracts version from request
   */
  extractVersion(request: Request): string {
    // Check URL path version
    const url = new URL(request.url);
    const pathMatch = url.pathname.match(/^\/v(\d+)\//);
    if (pathMatch) {
      return `v${pathMatch[1]}`;
    }

    // Check Accept header
    const acceptHeader = request.headers.get('accept');
    if (acceptHeader) {
      const versionMatch = acceptHeader.match(/application\/vnd\.api\+json; version=(\d+)/);
      if (versionMatch) {
        return `v${versionMatch[1]}`;
      }
    }

    // Check custom header
    const apiVersion = request.headers.get('api-version');
    if (apiVersion) {
      return apiVersion.startsWith('v') ? apiVersion : `v${apiVersion}`;
    }

    // Check query parameter
    const versionParam = url.searchParams.get('version');
    if (versionParam) {
      return versionParam.startsWith('v') ? versionParam : `v${versionParam}`;
    }

    // Return default version
    return this.config.defaultVersion;
  }

  /**
   * Gets version info
   */
  getVersionInfo(version: string): VersionInfo {
    return {
      version,
      isDeprecated: this.config.deprecatedVersions?.includes(version) || false,
      sunsetDate: this.config.sunsetVersions?.[version],
      supported: this.config.supportedVersions.includes(version),
    };
  }

  /**
   * Validates a version
   */
  isValidVersion(version: string): boolean {
    return this.config.supportedVersions.includes(version);
  }

  /**
   * Gets the best matching version for a client
   */
  negotiateVersion(request: Request): string {
    const requestedVersion = this.extractVersion(request);

    if (this.isValidVersion(requestedVersion)) {
      return requestedVersion;
    }

    // Return default if requested version is not supported
    return this.config.defaultVersion;
  }

  /**
   * Adds version headers to response
   */
  addVersionHeaders(response: Response, version: string): Response {
    const versionInfo = this.getVersionInfo(version);
    const newResponse = new Response(response.body, response);

    newResponse.headers.set('api-version', version);

    if (versionInfo.isDeprecated) {
      newResponse.headers.set('api-deprecated', 'true');
    }

    if (versionInfo.sunsetDate) {
      newResponse.headers.set('api-sunset', versionInfo.sunsetDate);
    }

    newResponse.headers.set('api-supported-versions', this.config.supportedVersions.join(', '));

    return newResponse;
  }

  /**
   * Updates configuration
   */
  updateConfig(config: Partial<VersionConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Create singleton instance
let versionNegotiator: VersionNegotiator | null = null;

/**
 * Initializes version negotiator
 */
export function initializeVersionNegotiation(config: VersionConfig): void {
  versionNegotiator = new VersionNegotiator(config);
}

/**
 * Extracts version from request
 */
export function extractAPIVersion(request: Request): string {
  if (!versionNegotiator) {
    versionNegotiator = new VersionNegotiator({
      defaultVersion: 'v1',
      supportedVersions: ['v1'],
    });
  }
  return versionNegotiator.extractVersion(request);
}

/**
 * Negotiates version
 */
export function negotiateAPIVersion(request: Request): string {
  if (!versionNegotiator) {
    versionNegotiator = new VersionNegotiator({
      defaultVersion: 'v1',
      supportedVersions: ['v1'],
    });
  }
  return versionNegotiator.negotiateVersion(request);
}

/**
 * Gets version info
 */
export function getAPIVersionInfo(version: string): VersionInfo {
  if (!versionNegotiator) {
    versionNegotiator = new VersionNegotiator({
      defaultVersion: 'v1',
      supportedVersions: ['v1'],
    });
  }
  return versionNegotiator.getVersionInfo(version);
}

/**
 * Adds version headers to response
 */
export function addAPIVersionHeaders(response: Response, version: string): Response {
  if (!versionNegotiator) {
    versionNegotiator = new VersionNegotiator({
      defaultVersion: 'v1',
      supportedVersions: ['v1'],
    });
  }
  return versionNegotiator.addVersionHeaders(response, version);
}

/**
 * Middleware for version negotiation
 */
export function versionNegotiationMiddleware(config?: VersionConfig) {
  const negotiator = config ? new VersionNegotiator(config) : new VersionNegotiator({
    defaultVersion: 'v1',
    supportedVersions: ['v1'],
  });

  return async (request: Request): Promise<Response | null> => {
    const version = negotiator.negotiateVersion(request);

    // Add version to request headers for downstream use
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    newRequest.headers.set('api-version', version);

    const response = await fetch(newRequest);
    return negotiator.addVersionHeaders(response, version);
  };
}

export default versionNegotiator;
