/**
 * Webhook Handler
 * Handles and validates incoming webhooks
 */

import { createHmac } from 'crypto';

export interface WebhookConfig {
  secret: string;
  allowedIPs?: string[];
  allowedEvents?: string[];
  maxPayloadSize?: number;
  timeout?: number;
}

export interface WebhookEvent {
  id: string;
  event: string;
  timestamp: number;
  data: any;
  signature?: string;
}

export interface WebhookHandlerResult {
  success: boolean;
  error?: string;
  statusCode: number;
}

/**
 * Webhook handler class
 */
export class WebhookHandler {
  private config: WebhookConfig;
  
  constructor(config: WebhookConfig) {
    this.config = {
      maxPayloadSize: 10 * 1024 * 1024, // 10MB
      timeout: 30000, // 30 seconds
      ...config,
    };
  }
  
  /**
   * Handles an incoming webhook
   */
  async handle(request: Request): Promise<WebhookHandlerResult> {
    try {
      // Validate IP
      if (this.config.allowedIPs) {
        const ip = this.getClientIP(request);
        if (!this.isIPAllowed(ip)) {
          return {
            success: false,
            error: 'IP not allowed',
            statusCode: 403,
          };
        }
      }
      
      // Validate content type
      const contentType = request.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        return {
          success: false,
          error: 'Invalid content type',
          statusCode: 400,
        };
      }
      
      // Validate payload size
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > (this.config.maxPayloadSize || 0)) {
        return {
          success: false,
          error: 'Payload too large',
          statusCode: 413,
        };
      }
      
      // Parse payload
      const payload = await request.json();
      
      // Validate signature
      const signature = request.headers.get('x-webhook-signature');
      if (signature) {
        if (!this.validateSignature(payload, signature)) {
          return {
            success: false,
            error: 'Invalid signature',
            statusCode: 401,
          };
        }
      }
      
      // Validate event type
      if (this.config.allowedEvents && payload.event) {
        if (!this.config.allowedEvents.includes(payload.event)) {
          return {
            success: false,
            error: 'Event not allowed',
            statusCode: 403,
          };
        }
      }
      
      // Validate event structure
      const event = this.validateEvent(payload);
      if (!event) {
        return {
          success: false,
          error: 'Invalid event structure',
          statusCode: 400,
        };
      }
      
      // Process event
      await this.processEvent(event);
      
      return {
        success: true,
        statusCode: 200,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500,
      };
    }
  }
  
  /**
   * Validates webhook signature
   */
  private validateSignature(payload: any, signature: string): boolean {
    const expectedSignature = this.generateSignature(payload);
    return signature === expectedSignature;
  }
  
  /**
   * Generates signature for payload
   */
  private generateSignature(payload: any): string {
    const hmac = createHmac('sha256', this.config.secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }
  
  /**
   * Gets client IP from request
   */
  private getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    return (forwarded || realIp || 'unknown').split(',')[0].trim();
  }
  
  /**
   * Checks if IP is allowed
   */
  private isIPAllowed(ip: string): boolean {
    if (!this.config.allowedIPs) return true;
    return this.config.allowedIPs.includes(ip);
  }
  
  /**
   * Validates event structure
   */
  private validateEvent(payload: any): WebhookEvent | null {
    if (!payload.id || !payload.event || !payload.data) {
      return null;
    }
    
    return {
      id: payload.id,
      event: payload.event,
      timestamp: payload.timestamp || Date.now(),
      data: payload.data,
      signature: payload.signature,
    };
  }
  
  /**
   * Processes a webhook event (to be overridden)
   */
  protected async processEvent(event: WebhookEvent): Promise<void> {
    // Override this method in subclasses
    console.log('Processing webhook event:', event);
  }
}

/**
 * GitHub webhook handler
 */
export class GitHubWebhookHandler extends WebhookHandler {
  protected async processEvent(event: WebhookEvent): Promise<void> {
    switch (event.event) {
      case 'push':
        await this.handlePush(event);
        break;
      case 'pull_request':
        await this.handlePullRequest(event);
        break;
      case 'issues':
        await this.handleIssue(event);
        break;
      default:
        console.log('Unhandled GitHub event:', event.event);
    }
  }
  
  private async handlePush(event: WebhookEvent): Promise<void> {
    console.log('Handling push event:', event.data);
    // Implement push handling logic
  }
  
  private async handlePullRequest(event: WebhookEvent): Promise<void> {
    console.log('Handling pull request event:', event.data);
    // Implement pull request handling logic
  }
  
  private async handleIssue(event: WebhookEvent): Promise<void> {
    console.log('Handling issue event:', event.data);
    // Implement issue handling logic
  }
}

/**
 * Stripe webhook handler
 */
export class StripeWebhookHandler extends WebhookHandler {
  protected async processEvent(event: WebhookEvent): Promise<void> {
    switch (event.event) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event);
        break;
      case 'payment_intent.failed':
        await this.handlePaymentFailed(event);
        break;
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event);
        break;
      default:
        console.log('Unhandled Stripe event:', event.event);
    }
  }
  
  private async handlePaymentSucceeded(event: WebhookEvent): Promise<void> {
    console.log('Handling payment succeeded:', event.data);
    // Implement payment success logic
  }
  
  private async handlePaymentFailed(event: WebhookEvent): Promise<void> {
    console.log('Handling payment failed:', event.data);
    // Implement payment failure logic
  }
  
  private async handleSubscriptionCreated(event: WebhookEvent): Promise<void> {
    console.log('Handling subscription created:', event.data);
    // Implement subscription creation logic
  }
}

/**
 * Creates a webhook handler
 */
export function createWebhookHandler(
  type: 'github' | 'stripe' | 'custom',
  config: WebhookConfig
): WebhookHandler {
  switch (type) {
    case 'github':
      return new GitHubWebhookHandler(config);
    case 'stripe':
      return new StripeWebhookHandler(config);
    case 'custom':
      return new WebhookHandler(config);
    default:
      throw new Error(`Unknown webhook type: ${type}`);
  }
}
