/**
 * Compression utilities for request/response optimization
 */

/**
 * Compress data using gzip (browser built-in)
 */
export async function compressGzip(data: string): Promise<Uint8Array> {
  if (typeof CompressionStream === 'undefined') {
    // Fallback for browsers without CompressionStream
    return new TextEncoder().encode(data);
  }

  const stream = new CompressionStream('gzip');
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  
  await writer.write(encoder.encode(data));
  await writer.close();
  
  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  // Combine chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

/**
 * Decompress gzip data
 */
export async function decompressGzip(data: Uint8Array): Promise<string> {
  if (typeof DecompressionStream === 'undefined') {
    // Fallback for browsers without DecompressionStream
    return new TextDecoder().decode(data);
  }

  const stream = new DecompressionStream('gzip');
  const writer = stream.writable.getWriter();
  
  await writer.write(data as any);
  await writer.close();
  
  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  // Combine chunks and decode
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return new TextDecoder().decode(result);
}

/**
 * Compress JSON data
 */
export async function compressJSON(data: any): Promise<Uint8Array> {
  const jsonString = JSON.stringify(data);
  return compressGzip(jsonString);
}

/**
 * Decompress JSON data
 */
export async function decompressJSON(data: Uint8Array): Promise<any> {
  const jsonString = await decompressGzip(data);
  return JSON.parse(jsonString);
}

/**
 * Check if compression is supported
 */
export function isCompressionSupported(): boolean {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
}

/**
 * Get compression ratio
 */
export function getCompressionRatio(original: string, compressed: Uint8Array): number {
  const originalSize = new TextEncoder().encode(original).length;
  const compressedSize = compressed.length;
  return (1 - compressedSize / originalSize) * 100;
}

/**
 * Compress with fallback
 */
export async function compressWithFallback(data: string): Promise<Uint8Array> {
  try {
    return await compressGzip(data);
  } catch (error) {
    console.warn('Compression failed, using uncompressed data:', error);
    return new TextEncoder().encode(data);
  }
}

/**
 * Decompress with fallback
 */
export async function decompressWithFallback(data: Uint8Array): Promise<string> {
  try {
    return await decompressGzip(data);
  } catch (error) {
    console.warn('Decompression failed, using raw data:', error);
    return new TextDecoder().decode(data);
  }
}

/**
 * Compress multiple chunks
 */
export async function compressChunks(chunks: string[]): Promise<Uint8Array> {
  const combined = chunks.join('');
  return compressGzip(combined);
}

/**
 * Decompress into chunks
 */
export async function decompressToChunks(data: Uint8Array, chunkSize: number = 1024): Promise<string[]> {
  const decompressed = await decompressGzip(data);
  const chunks: string[] = [];
  
  for (let i = 0; i < decompressed.length; i += chunkSize) {
    chunks.push(decompressed.slice(i, i + chunkSize));
  }
  
  return chunks;
}

/**
 * Stream compression for large data
 */
export async function* compressStream(data: AsyncIterable<string>): AsyncIterable<Uint8Array> {
  if (typeof CompressionStream === 'undefined') {
    for await (const chunk of data) {
      yield new TextEncoder().encode(chunk);
    }
    return;
  }

  const stream = new CompressionStream('gzip');
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();
  
  // Start writing in background
  const writePromise = (async () => {
    for await (const chunk of data) {
      await writer.write(new TextEncoder().encode(chunk));
    }
    await writer.close();
  })();

  // Read compressed data
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  } finally {
    await writePromise;
  }
}

/**
 * Stream decompression for large data
 */
export async function* decompressStream(data: AsyncIterable<Uint8Array>): AsyncIterable<string> {
  if (typeof DecompressionStream === 'undefined') {
    for await (const chunk of data) {
      yield new TextDecoder().decode(chunk);
    }
    return;
  }

  const stream = new DecompressionStream('gzip');
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();
  
  // Start writing in background
  const writePromise = (async () => {
    for await (const chunk of data) {
      await writer.write(chunk as any);
    }
    await writer.close();
  })();

  // Read decompressed data
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield new TextDecoder().decode(value);
    }
  } finally {
    await writePromise;
  }
}
