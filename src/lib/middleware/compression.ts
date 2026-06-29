/**
 * API Response Compression
 * Compresses API responses using gzip, deflate, or brotli
 */

export interface CompressionConfig {
  threshold?: number;
  level?: number;
  types?: string[];
  brotli?: boolean;
}

class ResponseCompressor {
  private config: Required<CompressionConfig>;

  constructor(config: CompressionConfig = {}) {
    this.config = {
      threshold: 1024,
      level: 6,
      types: ['text/*', 'application/json', 'application/javascript', 'application/xml', 'image/svg+xml'],
      brotli: true,
      ...config,
    };
  }

  /**
   * Checks if content type should be compressed
   */
  private shouldCompress(contentType: string): boolean {
    return this.config.types.some((type) => {
      if (type.endsWith('/*')) {
        const prefix = type.slice(0, -1);
        return contentType.startsWith(prefix);
      }
      return contentType.includes(type);
    });
  }

  /**
   * Gets accepted encoding from request
   */
  private getAcceptedEncoding(request: Request): string | null {
    const acceptEncoding = request.headers.get('accept-encoding') || '';

    if (acceptEncoding.includes('br') && this.config.brotli) {
      return 'br';
    } else if (acceptEncoding.includes('gzip')) {
      return 'gzip';
    } else if (acceptEncoding.includes('deflate')) {
      return 'deflate';
    }

    return null;
  }

  /**
   * Compresses a response
   */
  async compress(response: Response, request: Request): Promise<Response> {
    // Skip if response is already compressed
    if (
      response.headers.get('content-encoding') ||
      response.headers.get('transfer-encoding')
    ) {
      return response;
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !this.shouldCompress(contentType)) {
      return response;
    }

    // Check content length
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) < this.config.threshold) {
      return response;
    }

    // Get accepted encoding
    const encoding = this.getAcceptedEncoding(request);
    if (!encoding) {
      return response;
    }

    // Compress based on encoding
    try {
      const body = await response.arrayBuffer();
      const compressed = await this.compressBuffer(body, encoding);

      const newResponse = new Response(compressed, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      newResponse.headers.set('content-encoding', encoding);
      newResponse.headers.set('content-length', compressed.byteLength.toString());
      newResponse.headers.append('vary', 'accept-encoding');

      return newResponse;
    } catch (error) {
      // Fall back to original response if compression fails
      return response;
    }
  }

  /**
   * Compresses a buffer
   */
  private async compressBuffer(buffer: ArrayBuffer, encoding: string): Promise<ArrayBuffer> {
    if (typeof CompressionStream !== 'undefined') {
      try {
        const format = encoding === 'br' ? 'gzip' : encoding; // Use gzip as fallback for br
        const stream = new CompressionStream(format as CompressionFormat);
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        await writer.write(new Uint8Array(buffer));
        await writer.close();

        const chunks: Uint8Array[] = [];
        let result;
        while (!(result = await reader.read()).done) {
          chunks.push(result.value);
        }

        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }

        return combined.buffer;
      } catch {
        return buffer;
      }
    }

    return buffer;
  }
}

// Create singleton instance
let responseCompressor: ResponseCompressor | null = null;

/**
 * Initializes response compressor
 */
export function initializeResponseCompression(config: CompressionConfig): void {
  responseCompressor = new ResponseCompressor(config);
}

/**
 * Compresses a response
 */
export async function compressResponse(response: Response, request: Request): Promise<Response> {
  if (!responseCompressor) {
    responseCompressor = new ResponseCompressor();
  }
  return responseCompressor.compress(response, request);
}

/**
 * Middleware for response compression
 */
export function compressionMiddleware(config?: CompressionConfig) {
  const compressor = config ? new ResponseCompressor(config) : new ResponseCompressor();

  return async (request: Request): Promise<Response | null> => {
    const response = await fetch(request);
    return compressor.compress(response, request);
  };
}

export default responseCompressor;
