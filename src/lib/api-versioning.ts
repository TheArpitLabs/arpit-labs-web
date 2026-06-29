/**
 * API Versioning Support
 * Manages API versioning for backward compatibility
 */

export interface APIVersion {
  version: string;
  deprecated?: boolean;
  sunsetDate?: Date;
  supportedUntil?: Date;
}

export interface VersionedResponse<T> {
  data: T;
  version: string;
  deprecated?: boolean;
  sunsetDate?: string;
}

export interface APIVersionConfig {
  currentVersion: string;
  supportedVersions: string[];
  defaultVersion: string;
  versionHeader?: string;
}

/**
 * API version manager
 */
class APIVersionManager {
  private config: APIVersionConfig;
  private versions = new Map<string, APIVersion>();

  constructor(config: APIVersionConfig) {
    this.config = {
      versionHeader: 'X-API-Version',
      ...config,
    };
  }

  /**
   * Registers an API version
   */
  registerVersion(version: APIVersion): void {
    this.versions.set(version.version, version);
  }

  /**
   * Gets version information
   */
  getVersion(version: string): APIVersion | undefined {
    return this.versions.get(version);
  }

  /**
   * Extracts version from request
   */
  extractVersion(request: Request): string {
    // Try header first
    const headerVersion = request.headers.get(
      this.config.versionHeader || 'X-API-Version'
    );
    if (headerVersion) {
      return headerVersion;
    }

    // Try URL parameter
    const url = new URL(request.url);
    const paramVersion = url.searchParams.get('version');
    if (paramVersion) {
      return paramVersion;
    }

    // Try path prefix
    const pathMatch = request.url.match(/\/v(\d+(?:\.\d+)*)/);
    if (pathMatch) {
      return `v${pathMatch[1]}`;
    }

    // Return default version
    return this.config.defaultVersion;
  }

  /**
   * Validates if a version is supported
   */
  isVersionSupported(version: string): boolean {
    return this.config.supportedVersions.includes(version);
  }

  /**
   * Gets the appropriate version for a request
   */
  getRequestVersion(request: Request): string {
    const requestedVersion = this.extractVersion(request);

    if (this.isVersionSupported(requestedVersion)) {
      return requestedVersion;
    }

    // Return default version if requested version is not supported
    return this.config.defaultVersion;
  }

  /**
   * Wraps response with version information
   */
  wrapResponse<T>(data: T, version: string): VersionedResponse<T> {
    const versionInfo = this.getVersion(version);

    return {
      data,
      version,
      deprecated: versionInfo?.deprecated,
      sunsetDate: versionInfo?.sunsetDate?.toISOString(),
    };
  }

  /**
   * Adds version headers to response
   */
  addVersionHeaders(response: Response, version: string): Response {
    const versionInfo = this.getVersion(version);
    const newResponse = new Response(response.body, response);

    newResponse.headers.set('X-API-Version', version);
    newResponse.headers.set('X-API-Current-Version', this.config.currentVersion);

    if (versionInfo?.deprecated) {
      newResponse.headers.set('X-API-Deprecated', 'true');
      if (versionInfo.sunsetDate) {
        newResponse.headers.set(
          'X-API-Sunset-Date',
          versionInfo.sunsetDate.toISOString()
        );
      }
    }

    return newResponse;
  }

  /**
   * Transforms data based on version
   */
  transformData<T>(data: T, fromVersion: string, toVersion: string): T {
    // Implement version-specific transformations
    // This is a placeholder - in a real implementation, you would have
    // specific transformers for each version transition
    return data;
  }

  /**
   * Gets all supported versions
   */
  getSupportedVersions(): string[] {
    return [...this.config.supportedVersions];
  }

  /**
   * Gets deprecated versions
   */
  getDeprecatedVersions(): APIVersion[] {
    return Array.from(this.versions.values()).filter((v) => v.deprecated);
  }
}

// Create default instance
const defaultConfig: APIVersionConfig = {
  currentVersion: 'v1',
  supportedVersions: ['v1'],
  defaultVersion: 'v1',
  versionHeader: 'X-API-Version',
};

const apiVersionManager = new APIVersionManager(defaultConfig);

/**
 * Initialize API versioning
 */
export function initializeAPIVersioning(config: APIVersionConfig): void {
  Object.assign(defaultConfig, config);
}

/**
 * Register an API version
 */
export function registerAPIVersion(version: APIVersion): void {
  apiVersionManager.registerVersion(version);
}

/**
 * Get version from request
 */
export function getAPIVersion(request: Request): string {
  return apiVersionManager.getRequestVersion(request);
}

/**
 * Check if version is supported
 */
export function isAPIVersionSupported(version: string): boolean {
  return apiVersionManager.isVersionSupported(version);
}

/**
 * Wrap response with version info
 */
export function wrapAPIResponse<T>(
  data: T,
  version: string
): VersionedResponse<T> {
  return apiVersionManager.wrapResponse(data, version);
}

/**
 * Add version headers to response
 */
export function addAPIVersionHeaders(response: Response, version: string): Response {
  return apiVersionManager.addVersionHeaders(response, version);
}

/**
 * Transform data between versions
 */
export function transformAPIVersion<T>(
  data: T,
  fromVersion: string,
  toVersion: string
): T {
  return apiVersionManager.transformData(data, fromVersion, toVersion);
}

/**
 * Middleware for API versioning
 */
export function apiVersioningMiddleware(request: Request): Response | null {
  const version = getAPIVersion(request);

  if (!isAPIVersionSupported(version)) {
    return new Response(
      JSON.stringify({
        error: 'Unsupported API version',
        supportedVersions: apiVersionManager.getSupportedVersions(),
        currentVersion: defaultConfig.currentVersion,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return null;
}

/**
 * Default API versions
 */
export const DEFAULT_API_VERSIONS: APIVersion[] = [
  {
    version: 'v1',
  },
];
