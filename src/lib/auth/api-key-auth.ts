/**
 * API Key Authentication
 * Manages API key generation, validation, and revocation
 */

import crypto from 'crypto';

export interface APIKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  scopes: string[];
  createdAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
  rateLimit?: number;
}

export interface APIKeyCreateOptions {
  name: string;
  userId: string;
  scopes: string[];
  expiresIn?: number; // milliseconds
  rateLimit?: number;
}

export interface APIKeyValidationResult {
  valid: boolean;
  apiKey?: APIKey;
  error?: string;
}

class APIKeyManager {
  private keys = new Map<string, APIKey>();
  private keyHashes = new Map<string, string>(); // Maps hash to key ID

  /**
   * Generates a new API key
   */
  generateKey(): string {
    const prefix = 'ak_';
    const randomBytes = crypto.randomBytes(32);
    const key = prefix + randomBytes.toString('hex');
    return key;
  }

  /**
   * Hashes an API key for storage
   */
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Creates a new API key
   */
  createKey(options: APIKeyCreateOptions): APIKey {
    const key = this.generateKey();
    const keyHash = this.hashKey(key);
    const id = crypto.randomUUID();

    const apiKey: APIKey = {
      id,
      key,
      name: options.name,
      userId: options.userId,
      scopes: options.scopes,
      createdAt: new Date(),
      expiresAt: options.expiresIn ? new Date(Date.now() + options.expiresIn) : undefined,
      rateLimit: options.rateLimit,
    };

    this.keys.set(id, apiKey);
    this.keyHashes.set(keyHash, id);

    return apiKey;
  }

  /**
   * Validates an API key
   */
  validateKey(key: string): APIKeyValidationResult {
    if (!key || typeof key !== 'string') {
      return { valid: false, error: 'Invalid key format' };
    }

    const keyHash = this.hashKey(key);
    const keyId = this.keyHashes.get(keyHash);

    if (!keyId) {
      return { valid: false, error: 'Key not found' };
    }

    const apiKey = this.keys.get(keyId);

    if (!apiKey) {
      return { valid: false, error: 'Key not found' };
    }

    // Check if revoked
    if (apiKey.revokedAt) {
      return { valid: false, error: 'Key has been revoked' };
    }

    // Check if expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false, error: 'Key has expired' };
    }

    // Update last used timestamp
    apiKey.lastUsedAt = new Date();

    return { valid: true, apiKey };
  }

  /**
   * Checks if an API key has a specific scope
   */
  hasScope(key: string, scope: string): boolean {
    const result = this.validateKey(key);
    if (!result.valid || !result.apiKey) {
      return false;
    }

    return result.apiKey.scopes.includes(scope);
  }

  /**
   * Checks if an API key has any of the specified scopes
   */
  hasAnyScope(key: string, scopes: string[]): boolean {
    const result = this.validateKey(key);
    if (!result.valid || !result.apiKey) {
      return false;
    }

    return scopes.some(scope => result.apiKey!.scopes.includes(scope));
  }

  /**
   * Revokes an API key
   */
  revokeKey(keyId: string): boolean {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      return false;
    }

    apiKey.revokedAt = new Date();
    return true;
  }

  /**
   * Deletes an API key
   */
  deleteKey(keyId: string): boolean {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      return false;
    }

    const keyHash = this.hashKey(apiKey.key);
    this.keys.delete(keyId);
    this.keyHashes.delete(keyHash);
    return true;
  }

  /**
   * Gets all keys for a user
   */
  getUserKeys(userId: string): APIKey[] {
    return Array.from(this.keys.values()).filter(
      key => key.userId === userId && !key.revokedAt
    );
  }

  /**
   * Gets a key by ID
   */
  getKey(keyId: string): APIKey | undefined {
    return this.keys.get(keyId);
  }

  /**
   * Updates a key
   */
  updateKey(keyId: string, updates: Partial<Omit<APIKey, 'id' | 'key' | 'createdAt'>>): boolean {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      return false;
    }

    Object.assign(apiKey, updates);
    return true;
  }

  /**
   * Cleans up expired keys
   */
  cleanupExpiredKeys(): number {
    let count = 0;
    const now = new Date();

    for (const [id, key] of this.keys.entries()) {
      if (key.expiresAt && key.expiresAt < now) {
        this.keys.delete(id);
        const keyHash = this.hashKey(key.key);
        this.keyHashes.delete(keyHash);
        count++;
      }
    }

    return count;
  }

  /**
   * Gets statistics
   */
  getStatistics(): {
    totalKeys: number;
    activeKeys: number;
    revokedKeys: number;
    expiredKeys: number;
  } {
    const now = new Date();
    let activeKeys = 0;
    let revokedKeys = 0;
    let expiredKeys = 0;

    for (const key of this.keys.values()) {
      if (key.revokedAt) {
        revokedKeys++;
      } else if (key.expiresAt && key.expiresAt < now) {
        expiredKeys++;
      } else {
        activeKeys++;
      }
    }

    return {
      totalKeys: this.keys.size,
      activeKeys,
      revokedKeys,
      expiredKeys,
    };
  }
}

// Create singleton instance
const apiKeyManager = new APIKeyManager();

/**
 * Generates a new API key
 */
export function generateAPIKey(): string {
  return apiKeyManager.generateKey();
}

/**
 * Creates a new API key
 */
export function createAPIKey(options: APIKeyCreateOptions): APIKey {
  return apiKeyManager.createKey(options);
}

/**
 * Validates an API key
 */
export function validateAPIKey(key: string): APIKeyValidationResult {
  return apiKeyManager.validateKey(key);
}

/**
 * Checks if an API key has a specific scope
 */
export function hasAPIScope(key: string, scope: string): boolean {
  return apiKeyManager.hasScope(key, scope);
}

/**
 * Checks if an API key has any of the specified scopes
 */
export function hasAnyAPIScope(key: string, scopes: string[]): boolean {
  return apiKeyManager.hasAnyScope(key, scopes);
}

/**
 * Revokes an API key
 */
export function revokeAPIKey(keyId: string): boolean {
  return apiKeyManager.revokeKey(keyId);
}

/**
 * Deletes an API key
 */
export function deleteAPIKey(keyId: string): boolean {
  return apiKeyManager.deleteKey(keyId);
}

/**
 * Gets all keys for a user
 */
export function getUserAPIKeys(userId: string): APIKey[] {
  return apiKeyManager.getUserKeys(userId);
}

/**
 * Gets a key by ID
 */
export function getAPIKey(keyId: string): APIKey | undefined {
  return apiKeyManager.getKey(keyId);
}

/**
 * Updates a key
 */
export function updateAPIKey(keyId: string, updates: Partial<Omit<APIKey, 'id' | 'key' | 'createdAt'>>): boolean {
  return apiKeyManager.updateKey(keyId, updates);
}

/**
 * Cleans up expired keys
 */
export function cleanupExpiredAPIKeys(): number {
  return apiKeyManager.cleanupExpiredKeys();
}

/**
 * Gets API key statistics
 */
export function getAPIKeyStatistics() {
  return apiKeyManager.getStatistics();
}

/**
 * Middleware for API key authentication
 */
export function apiKeyAuthMiddleware(requiredScopes?: string[]) {
  return async (request: Request): Promise<Response | null> => {
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = validateAPIKey(apiKey);

    if (!result.valid) {
      return new Response(
        JSON.stringify({ error: result.error || 'Invalid API key' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check scopes if required
    if (requiredScopes && requiredScopes.length > 0) {
      if (!hasAnyAPIScope(apiKey, requiredScopes)) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return null;
  };
}

/**
 * Common API key scopes
 */
export const APIKeyScopes = {
  READ: 'read',
  WRITE: 'write',
  ADMIN: 'admin',
  PROJECTS_READ: 'projects:read',
  PROJECTS_WRITE: 'projects:write',
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  ANALYTICS: 'analytics',
} as const;

export default apiKeyManager;
