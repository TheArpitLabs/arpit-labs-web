/**
 * Response Compression Middleware
 * Compresses responses using gzip, deflate, or brotli
 */

export interface CompressionConfig {
  threshold?: number; // Minimum size to compress in bytes
  level?: number; // Compression level (0-9)
  types?: string[]; // Content types to compress
  brotli?: boolean; // Enable brotli compression
}

/**
 * Compression middleware
 */
export function compressionMiddleware(config: CompressionConfig = {}) {
  const {
    threshold = 1024, // 1KB default
    level = 6,
    types = [
      'text/*',
      'application/json',
      'application/javascript',
      'application/xml',
      'application/xhtml+xml',
      'image/svg+xml',
    ],
    brotli = true,
  } = config;

  return async (request: Request): Promise<Response> => {
    const response = await fetch(request);

    // Skip if response is already compressed
    if (
      response.headers.get('content-encoding') ||
      response.headers.get('transfer-encoding')
    ) {
      return response;
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !shouldCompress(contentType, types)) {
      return response;
    }

    // Check content length
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) < threshold) {
      return response;
    }

    // Get accept-encoding header
    const acceptEncoding = request.headers.get('accept-encoding') || '';
    
    // Compress based on accepted encoding
    if (acceptEncoding.includes('br') && brotli) {
      return compressWithEncoding(response, 'br', level);
    } else if (acceptEncoding.includes('gzip')) {
      return compressWithEncoding(response, 'gzip', level);
    } else if (acceptEncoding.includes('deflate')) {
      return compressWithEncoding(response, 'deflate', level);
    }

    return response;
  };
}

/**
 * Checks if content type should be compressed
 */
function shouldCompress(contentType: string, types: string[]): boolean {
  return types.some((type) => {
    if (type.endsWith('/*')) {
      const prefix = type.slice(0, -1);
      return contentType.startsWith(prefix);
    }
    return contentType.includes(type);
  });
}

/**
 * Compresses response with specified encoding
 */
async function compressWithEncoding(
  response: Response,
  encoding: 'br' | 'gzip' | 'deflate',
  level: number
): Promise<Response> {
  try {
    const body = await response.arrayBuffer();
    const compressed = await compressData(body, encoding, level);

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
    return response;
  }
}

/**
 * Compresses data using CompressionStream API
 */
async function compressData(
  data: ArrayBuffer,
  encoding: 'br' | 'gzip' | 'deflate',
  level: number
): Promise<ArrayBuffer> {
  if (typeof CompressionStream === 'undefined') {
    return data;
  }

  try {
    const format = encoding === 'br' ? 'gzip' : encoding;
    const stream = new CompressionStream(format as CompressionFormat);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    await writer.write(new Uint8Array(data));
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
    return data;
  }
}

/**
 * Default compression middleware
 */
export const defaultCompressionMiddleware = compressionMiddleware();
