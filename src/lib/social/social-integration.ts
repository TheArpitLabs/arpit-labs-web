/**
 * Social Media Integration
 * Handles social media sharing, authentication, and API integration
 */

export interface SocialPlatform {
  id: string;
  name: string;
  shareUrl: string;
  icon: string;
}

export interface ShareOptions {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  hashtags?: string[];
}

export interface SocialAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface SocialUserProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  provider: string;
}

class SocialMediaManager {
  private platforms: SocialPlatform[] = [
    {
      id: 'twitter',
      name: 'Twitter',
      shareUrl: 'https://twitter.com/intent/tweet',
      icon: '🐦',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      shareUrl: 'https://www.facebook.com/sharer/sharer.php',
      icon: '📘',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      shareUrl: 'https://www.linkedin.com/sharing/share-offsite/',
      icon: '💼',
    },
    {
      id: 'reddit',
      name: 'Reddit',
      shareUrl: 'https://www.reddit.com/submit',
      icon: '🔴',
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      shareUrl: 'https://pinterest.com/pin/create/button/',
      icon: '📌',
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      shareUrl: 'https://api.whatsapp.com/send',
      icon: '💬',
    },
    {
      id: 'email',
      name: 'Email',
      shareUrl: 'mailto:',
      icon: '✉️',
    },
  ];

  private authConfigs = new Map<string, SocialAuthConfig>();

  /**
   * Gets all available platforms
   */
  getPlatforms(): SocialPlatform[] {
    return [...this.platforms];
  }

  /**
   * Gets a platform by ID
   */
  getPlatform(id: string): SocialPlatform | undefined {
    return this.platforms.find(p => p.id === id);
  }

  /**
   * Generates a share URL for a platform
   */
  generateShareUrl(platformId: string, options: ShareOptions): string {
    const platform = this.getPlatform(platformId);
    if (!platform) {
      throw new Error(`Platform '${platformId}' not found`);
    }

    const url = new URL(platform.shareUrl);
    const params = new URLSearchParams();

    switch (platformId) {
      case 'twitter':
        params.set('url', options.url);
        if (options.title) params.set('text', options.title);
        if (options.hashtags) params.set('hashtags', options.hashtags.join(','));
        break;

      case 'facebook':
        params.set('u', options.url);
        break;

      case 'linkedin':
        params.set('url', options.url);
        if (options.title) params.set('title', options.title);
        if (options.description) params.set('summary', options.description);
        break;

      case 'reddit':
        params.set('url', options.url);
        if (options.title) params.set('title', options.title);
        break;

      case 'pinterest':
        params.set('url', options.url);
        if (options.description) params.set('description', options.description);
        if (options.image) params.set('media', options.image);
        break;

      case 'whatsapp':
        params.set('text', `${options.title || ''} ${options.url}`);
        break;

      case 'email':
        params.set('subject', options.title || 'Check this out');
        params.set('body', `${options.description || ''}\n\n${options.url}`);
        break;
    }

    url.search = params.toString();
    return url.toString();
  }

  /**
   * Opens a share dialog
   */
  openShareDialog(platformId: string, options: ShareOptions): void {
    const url = this.generateShareUrl(platformId, options);
    window.open(url, '_blank', 'width=600,height=400');
  }

  /**
   * Registers authentication config for a platform
   */
  registerAuthConfig(platformId: string, config: SocialAuthConfig): void {
    this.authConfigs.set(platformId, config);
  }

  /**
   * Gets authentication URL for a platform
   */
  getAuthUrl(platformId: string, state?: string): string {
    const config = this.authConfigs.get(platformId);
    if (!config) {
      throw new Error(`Auth config not found for platform '${platformId}'`);
    }

    const authUrls: Record<string, string> = {
      twitter: 'https://twitter.com/oauth/authorize',
      facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      github: 'https://github.com/login/oauth/authorize',
    };

    const url = new URL(authUrls[platformId] || '');
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', config.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', config.scopes.join(' '));
    if (state) {
      url.searchParams.set('state', state);
    }

    return url.toString();
  }

  /**
   * Exchanges authorization code for access token
   */
  async exchangeCodeForToken(
    platformId: string,
    code: string
  ): Promise<{ access_token: string; refresh_token?: string }> {
    const config = this.authConfigs.get(platformId);
    if (!config) {
      throw new Error(`Auth config not found for platform '${platformId}'`);
    }

    // In a real implementation, this would make an API call to the platform
    console.log(`Exchanging code for token on ${platformId}`);
    
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
    };
  }

  /**
   * Gets user profile from platform
   */
  async getUserProfile(
    platformId: string,
    accessToken: string
  ): Promise<SocialUserProfile> {
    // In a real implementation, this would fetch the user profile
    console.log(`Fetching user profile from ${platformId}`);
    
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      id: 'mock_user_id',
      name: 'Mock User',
      email: 'user@example.com',
      avatar: 'https://example.com/avatar.jpg',
      provider: platformId,
    };
  }

  /**
   * Posts to social media
   */
  async postToPlatform(
    platformId: string,
    accessToken: string,
    content: {
      text?: string;
      image?: string;
      url?: string;
    }
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    // In a real implementation, this would post to the platform's API
    console.log(`Posting to ${platformId}:`, content);
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      postId: `post-${Date.now()}`,
    };
  }

  /**
   * Validates a social media handle
   */
  validateHandle(platformId: string, handle: string): boolean {
    const patterns: Record<string, RegExp> = {
      twitter: /^@?[A-Za-z0-9_]{1,15}$/,
      facebook: /^[a-z\d.]{5,}$/i,
      instagram: /^[a-z0-9._]{1,30}$/i,
      linkedin: /^[a-z0-9]{3,100}$/i,
    };

    const pattern = patterns[platformId];
    if (!pattern) return true; // No validation for unknown platforms

    return pattern.test(handle);
  }

  /**
   * Extracts social media handles from text
   */
  extractHandles(text: string): Record<string, string[]> {
    const handles: Record<string, string[]> = {
      twitter: [],
      instagram: [],
      facebook: [],
      linkedin: [],
    };

    const twitterRegex = /@(\w{1,15})/g;
    const instagramRegex = /@(\w{1,30})/g;
    const facebookRegex = /facebook\.com\/([a-z\d.]+)/gi;
    const linkedinRegex = /linkedin\.com\/in\/([a-z0-9-]+)/gi;

    let match;
    while ((match = twitterRegex.exec(text)) !== null) {
      handles.twitter.push(match[1]);
    }

    while ((match = instagramRegex.exec(text)) !== null) {
      handles.instagram.push(match[1]);
    }

    while ((match = facebookRegex.exec(text)) !== null) {
      handles.facebook.push(match[1]);
    }

    while ((match = linkedinRegex.exec(text)) !== null) {
      handles.linkedin.push(match[1]);
    }

    return handles;
  }
}

// Create singleton instance
const socialManager = new SocialMediaManager();

/**
 * Gets all social platforms
 */
export function getSocialPlatforms(): SocialPlatform[] {
  return socialManager.getPlatforms();
}

/**
 * Gets a social platform
 */
export function getSocialPlatform(id: string): SocialPlatform | undefined {
  return socialManager.getPlatform(id);
}

/**
 * Generates a share URL
 */
export function generateShareUrl(platformId: string, options: ShareOptions): string {
  return socialManager.generateShareUrl(platformId, options);
}

/**
 * Opens a share dialog
 */
export function openShareDialog(platformId: string, options: ShareOptions): void {
  socialManager.openShareDialog(platformId, options);
}

/**
 * Registers auth config
 */
export function registerSocialAuthConfig(
  platformId: string,
  config: SocialAuthConfig
): void {
  socialManager.registerAuthConfig(platformId, config);
}

/**
 * Gets auth URL
 */
export function getSocialAuthUrl(platformId: string, state?: string): string {
  return socialManager.getAuthUrl(platformId, state);
}

/**
 * Exchanges code for token
 */
export async function exchangeSocialCodeForToken(
  platformId: string,
  code: string
) {
  return socialManager.exchangeCodeForToken(platformId, code);
}

/**
 * Gets user profile
 */
export async function getSocialUserProfile(
  platformId: string,
  accessToken: string
) {
  return socialManager.getUserProfile(platformId, accessToken);
}

/**
 * Posts to platform
 */
export async function postToSocialPlatform(
  platformId: string,
  accessToken: string,
  content: {
    text?: string;
    image?: string;
    url?: string;
  }
) {
  return socialManager.postToPlatform(platformId, accessToken, content);
}

/**
 * Validates handle
 */
export function validateSocialHandle(platformId: string, handle: string): boolean {
  return socialManager.validateHandle(platformId, handle);
}

/**
 * Extracts handles from text
 */
export function extractSocialHandles(text: string): Record<string, string[]> {
  return socialManager.extractHandles(text);
}

export default socialManager;
