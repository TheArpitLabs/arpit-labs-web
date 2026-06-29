/**
 * API Response Envelope
 * Wraps API responses in a standard envelope format
 */

export interface ResponseEnvelopeData<T> {
  data: T;
  meta?: {
    timestamp: number;
    requestId?: string;
    version?: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  links?: {
    self?: string;
    next?: string;
    previous?: string;
    first?: string;
    last?: string;
  };
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}

export type ResponseEnvelope<T> = ResponseEnvelopeData<T>;

export interface EnvelopeConfig {
  includeMeta?: boolean;
  includeRequestId?: boolean;
  includeVersion?: string;
  includePagination?: boolean;
  includeLinks?: boolean;
}

class ResponseEnvelopeHelper {
  private config: Required<EnvelopeConfig> = {
    includeMeta: true,
    includeRequestId: true,
    includeVersion: 'v1',
    includePagination: false,
    includeLinks: false,
  };

  /**
   * Wraps data in an envelope
   */
  wrap<T>(data: T, options?: Partial<EnvelopeConfig & { pagination?: any; links?: any }>): ResponseEnvelopeData<T> {
    const mergedConfig = { ...this.config, ...options };

    const envelope: ResponseEnvelopeData<T> = {
      data,
    };

    // Add meta
    if (mergedConfig.includeMeta) {
      envelope.meta = {
        timestamp: Date.now(),
        requestId: mergedConfig.includeRequestId ? this.generateRequestId() : undefined,
        version: mergedConfig.includeVersion,
      };
    }

    // Add pagination
    if (mergedConfig.includePagination && options?.pagination) {
      envelope.pagination = options.pagination;
    }

    // Add links
    if (mergedConfig.includeLinks && options?.links) {
      envelope.links = options.links;
    }

    return envelope;
  }

  /**
   * Wraps an error in an envelope
   */
  wrapError(errors: Array<{ code: string; message: string; field?: string }>): ResponseEnvelopeData<null> {
    return {
      data: null,
      meta: {
        timestamp: Date.now(),
        requestId: this.generateRequestId(),
        version: this.config.includeVersion,
      },
      errors,
    };
  }

  /**
   * Generates a request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Unwraps an envelope
   */
  unwrap<T>(envelope: ResponseEnvelopeData<T>): T {
    return envelope.data;
  }

  /**
   * Checks if envelope has errors
   */
  hasErrors(envelope: ResponseEnvelopeData<any>): boolean {
    return !!(envelope.errors && envelope.errors.length > 0);
  }

  /**
   * Updates configuration
   */
  updateConfig(config: Partial<EnvelopeConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Create singleton instance
const responseEnvelope = new ResponseEnvelopeHelper();

/**
 * Wraps data in envelope
 */
export function wrapResponse<T>(
  data: T,
  options?: Partial<EnvelopeConfig & { pagination?: any; links?: any }>
): ResponseEnvelopeData<T> {
  return responseEnvelope.wrap(data, options);
}

/**
 * Wraps error in envelope
 */
export function wrapErrorResponse(
  errors: Array<{ code: string; message: string; field?: string }>
): ResponseEnvelopeData<null> {
  return responseEnvelope.wrapError(errors);
}

/**
 * Unwraps envelope
 */
export function unwrapResponse<T>(envelope: ResponseEnvelopeData<T>): T {
  return responseEnvelope.unwrap(envelope);
}

/**
 * Checks if envelope has errors
 */
export function hasResponseErrors(envelope: ResponseEnvelopeData<any>): boolean {
  return responseEnvelope.hasErrors(envelope);
}

/**
 * Updates envelope configuration
 */
export function updateEnvelopeConfig(config: Partial<EnvelopeConfig>): void {
  responseEnvelope.updateConfig(config);
}

/**
 * Middleware for response envelope
 */
export function responseEnvelopeMiddleware(config?: Partial<EnvelopeConfig>) {
  const envelope = config ? new ResponseEnvelopeHelper() : responseEnvelope;
  if (config) envelope.updateConfig(config);

  return async (request: Request): Promise<Response | null> => {
    const response = await fetch(request);

    // Only wrap JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return response;
    }

    try {
      const data = await response.clone().json();
      const wrapped = envelope.wrap(data);

      return new Response(JSON.stringify(wrapped), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch {
      return response;
    }
  };
}

export default responseEnvelope;
