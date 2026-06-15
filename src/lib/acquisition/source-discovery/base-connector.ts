/**
 * Base Source Connector
 * 
 * Abstract base class for all source connectors providing common functionality
 */

import { SourceConnector, DiscoveryConfig, DiscoveryResult, DiscoveredContent } from './types';

export abstract class BaseConnector implements SourceConnector {
  protected config: Record<string, unknown> = {};
  protected rateLimitState = {
    requestsThisMinute: 0,
    requestsThisHour: 0,
    minuteResetTime: Date.now() + 60000,
    hourResetTime: Date.now() + 3600000,
  };

  /**
   * Initialize the connector with authentication and configuration
   */
  async initialize(config: Record<string, unknown>): Promise<void> {
    this.config = config;
    await this.validateConfig();
  }

  /**
   * Validate the configuration
   */
  protected abstract validateConfig(): Promise<void>;

  /**
   * Discover content based on rules and patterns
   */
  abstract discover(config: DiscoveryConfig): Promise<DiscoveryResult>;

  /**
   * Fetch detailed content for a specific item
   */
  abstract fetchContent(externalId: string): Promise<Record<string, unknown>>;

  /**
   * Validate if content should be acquired
   */
  async validateContent(content: Record<string, unknown>): Promise<boolean> {
    // Base validation - ensure required fields exist
    const requiredFields = ['title', 'sourceUrl'];
    for (const field of requiredFields) {
      if (!content[field]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Normalize content to standard format
   */
  abstract normalizeContent(content: Record<string, unknown>): Promise<Record<string, unknown>>;

  /**
   * Check rate limits and wait if necessary
   */
  async checkRateLimit(): Promise<void> {
    const now = Date.now();

    // Reset counters if time has passed
    if (now > this.rateLimitState.minuteResetTime) {
      this.rateLimitState.requestsThisMinute = 0;
      this.rateLimitState.minuteResetTime = now + 60000;
    }

    if (now > this.rateLimitState.hourResetTime) {
      this.rateLimitState.requestsThisHour = 0;
      this.rateLimitState.hourResetTime = now + 3600000;
    }

    // Get rate limits from config
    const rateLimit = this.config.rateLimit as {
      requestsPerMinute: number;
      requestsPerHour: number;
    } || { requestsPerMinute: 60, requestsPerHour: 1000 };

    // Wait if minute limit reached
    if (this.rateLimitState.requestsThisMinute >= rateLimit.requestsPerMinute) {
      const waitTime = this.rateLimitState.minuteResetTime - now;
      await this.sleep(waitTime);
      this.rateLimitState.requestsThisMinute = 0;
      this.rateLimitState.minuteResetTime = Date.now() + 60000;
    }

    // Wait if hour limit reached
    if (this.rateLimitState.requestsThisHour >= rateLimit.requestsPerHour) {
      const waitTime = this.rateLimitState.hourResetTime - now;
      await this.sleep(waitTime);
      this.rateLimitState.requestsThisHour = 0;
      this.rateLimitState.hourResetTime = Date.now() + 3600000;
    }

    // Increment counters
    this.rateLimitState.requestsThisMinute++;
    this.rateLimitState.requestsThisHour++;
  }

  /**
   * Get connector health status
   */
  async getHealth(): Promise<{
    healthy: boolean;
    message: string;
    metadata?: Record<string, unknown>;
  }> {
    try {
      // Perform a simple health check
      await this.validateConfig();
      return {
        healthy: true,
        message: 'Connector is healthy',
        metadata: {
          requestsThisMinute: this.rateLimitState.requestsThisMinute,
          requestsThisHour: this.rateLimitState.requestsThisHour,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Utility method to sleep for a specified duration
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Utility method to make HTTP requests with retry logic
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries = 3
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.checkRateLimit();
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Exponential backoff
        const backoffTime = Math.pow(2, attempt) * 1000;
        await this.sleep(backoffTime);
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Normalize URL to standard format
   */
  protected normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.href;
    } catch {
      return url;
    }
  }

  /**
   * Extract external ID from URL
   */
  protected extractExternalId(url: string): string {
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      return pathParts[pathParts.length - 1] || pathParts.join('/');
    } catch {
      return url;
    }
  }
}
