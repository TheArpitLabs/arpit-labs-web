/**
 * Webhook Signature Verification
 * Verifies webhook signatures for security
 */

import crypto from 'crypto';

export interface SignatureVerificationConfig {
  secret: string;
  algorithm?: 'sha256' | 'sha1' | 'sha512';
  headerName?: string;
  encoding?: 'hex' | 'base64';
}

export interface VerificationResult {
  valid: boolean;
  error?: string;
}

class WebhookSignatureVerifier {
  private config: Required<SignatureVerificationConfig>;

  constructor(config: SignatureVerificationConfig) {
    this.config = {
      algorithm: 'sha256',
      headerName: 'x-signature',
      encoding: 'hex',
      ...config,
    };
  }

  /**
   * Verifies a webhook signature
   */
  verify(payload: string, signature: string): VerificationResult {
    try {
      const expectedSignature = this.generateSignature(payload);

      if (signature !== expectedSignature) {
        return {
          valid: false,
          error: 'Signature mismatch',
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Generates a signature for a payload
   */
  generateSignature(payload: string): string {
    const hmac = crypto.createHmac(this.config.algorithm, this.config.secret);
    hmac.update(payload);
    const signature = hmac.digest(this.config.encoding);
    return signature;
  }

  /**
   * Verifies a request
   */
  async verifyRequest(request: Request): Promise<VerificationResult> {
    const signature = request.headers.get(this.config.headerName);

    if (!signature) {
      return {
        valid: false,
        error: `Missing ${this.config.headerName} header`,
      };
    }

    const payload = await request.text();
    return this.verify(payload, signature);
  }

  /**
   * Generates a signature for a response
   */
  signResponse(payload: string): string {
    return this.generateSignature(payload);
  }

  /**
   * Updates the configuration
   */
  updateConfig(config: Partial<SignatureVerificationConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Create singleton instance
let signatureVerifier: WebhookSignatureVerifier | null = null;

/**
 * Initializes the signature verifier
 */
export function initializeSignatureVerifier(config: SignatureVerificationConfig): void {
  signatureVerifier = new WebhookSignatureVerifier(config);
}

/**
 * Verifies a webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string): VerificationResult {
  if (!signatureVerifier) {
    throw new Error('Signature verifier not initialized');
  }
  return signatureVerifier.verify(payload, signature);
}

/**
 * Generates a signature
 */
export function generateWebhookSignature(payload: string): string {
  if (!signatureVerifier) {
    throw new Error('Signature verifier not initialized');
  }
  return signatureVerifier.generateSignature(payload);
}

/**
 * Verifies a request
 */
export async function verifyWebhookRequest(request: Request): Promise<VerificationResult> {
  if (!signatureVerifier) {
    throw new Error('Signature verifier not initialized');
  }
  return signatureVerifier.verifyRequest(request);
}

/**
 * Signs a response
 */
export function signWebhookResponse(payload: string): string {
  if (!signatureVerifier) {
    throw new Error('Signature verifier not initialized');
  }
  return signatureVerifier.signResponse(payload);
}

/**
 * Middleware for signature verification
 */
export function webhookSignatureMiddleware(config: SignatureVerificationConfig) {
  const verifier = new WebhookSignatureVerifier(config);

  return async (request: Request): Promise<Response | null> => {
    const signature = request.headers.get(config.headerName || 'x-signature');

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing signature header' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const payload = await request.text();
    const result = verifier.verify(payload, signature);

    if (!result.valid) {
      return new Response(
        JSON.stringify({ error: result.error || 'Invalid signature' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create a new request with the original body
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: payload,
    });

    return null;
  };
}

/**
 * Common webhook providers
 */
export const WebhookProviders = {
  github: {
    headerName: 'x-hub-signature-256',
    algorithm: 'sha256' as const,
  },
  stripe: {
    headerName: 'stripe-signature',
    algorithm: 'sha256' as const,
  },
  slack: {
    headerName: 'x-slack-signature',
    algorithm: 'sha256' as const,
  },
  shopify: {
    headerName: 'x-shopify-hmac-sha256',
    algorithm: 'sha256' as const,
  },
};

export default signatureVerifier;
