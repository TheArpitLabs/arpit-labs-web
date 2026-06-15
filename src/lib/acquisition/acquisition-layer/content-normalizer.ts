/**
 * Content Normalizer
 * 
 * Normalizes content to standard format
 */

import { ContentNormalizer } from './types';
import { ContentType, ContentProvider } from '../source-discovery/types';

export class BaseContentNormalizer implements ContentNormalizer {
  /**
   * Normalize content to standard format
   */
  async normalize(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    const normalized: Record<string, unknown> = { ...content };

    // Normalize text fields
    if (normalized.title) {
      normalized.title = this.normalizeText(normalized.title as string);
    }

    if (normalized.description) {
      normalized.description = this.normalizeText(normalized.description as string);
    }

    // Normalize arrays
    if (normalized.tags && Array.isArray(normalized.tags)) {
      normalized.tags = this.normalizeTags(normalized.tags as string[]);
    }

    if (normalized.categories && Array.isArray(normalized.categories)) {
      normalized.categories = this.normalizeTags(normalized.categories as string[]);
    }

    // Normalize URLs
    if (normalized.sourceUrl) {
      normalized.sourceUrl = this.normalizeUrl(normalized.sourceUrl as string);
    }

    if (normalized.repositoryUrl) {
      normalized.repositoryUrl = this.normalizeUrl(normalized.repositoryUrl as string);
    }

    // Normalize metadata
    if (normalized.metadata) {
      normalized.metadata = this.normalizeMetadata(normalized.metadata as Record<string, unknown>);
    }

    return normalized;
  }

  /**
   * Normalize text
   */
  protected normalizeText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\r\n]+/g, ' ');
  }

  /**
   * Normalize tags
   */
  protected normalizeTags(tags: string[]): string[] {
    return tags
      .filter(Boolean)
      .map(tag => this.normalizeTag(tag))
      .filter((tag, index, self) => self.indexOf(tag) === index); // Remove duplicates
  }

  /**
   * Normalize single tag
   */
  protected normalizeTag(tag: string): string {
    return tag
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Normalize URL
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
   * Normalize metadata
   */
  protected normalizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (value === null || value === undefined) continue;

      if (Array.isArray(value)) {
        normalized[key] = value.filter(Boolean);
      } else if (typeof value === 'object') {
        normalized[key] = this.normalizeMetadata(value as Record<string, unknown>);
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }
}

export class GitHubContentNormalizer extends BaseContentNormalizer {
  async normalize(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    const baseNormalized = await super.normalize(content);
    const normalized: Record<string, unknown> = { ...baseNormalized };

    // GitHub-specific normalization
    const metadata = normalized.metadata as Record<string, unknown> || {};

    // Normalize repository URL
    if (metadata.htmlUrl) {
      normalized.repositoryUrl = metadata.htmlUrl;
      normalized.sourceUrl = metadata.htmlUrl;
    }

    // Extract languages from metadata
    if (metadata.languages) {
      const languages = Object.keys(metadata.languages as Record<string, unknown>);
      normalized.tags = [
        ...(normalized.tags as string[] || []),
        ...languages.map(lang => lang.toLowerCase()),
      ];
    }

    // Normalize topics
    if (metadata.topics && Array.isArray(metadata.topics)) {
      normalized.tags = [
        ...(normalized.tags as string[] || []),
        ...metadata.topics.map((topic: string) => topic.toLowerCase()),
      ];
    }

    // Extract primary language as category
    if (metadata.language) {
      normalized.categories = [
        ...(normalized.categories as string[] || []),
        metadata.language.toString().toLowerCase(),
      ];
    }

    // Normalize author information
    if (metadata.owner) {
      const owner = metadata.owner as Record<string, unknown>;
      normalized.author = owner.login as string;
      normalized.authorUrl = `https://github.com/${owner.login}`;
      normalized.organization = owner.login as string;
      normalized.organizationUrl = `https://github.com/${owner.login}`;
    }

    return normalized;
  }
}

export class ArXivContentNormalizer extends BaseContentNormalizer {
  async normalize(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    const baseNormalized = await super.normalize(content);
    const normalized: Record<string, unknown> = { ...baseNormalized };

    // ArXiv-specific normalization
    const metadata = normalized.metadata as Record<string, unknown> || {};

    // Normalize categories
    if (metadata.categories && Array.isArray(metadata.categories)) {
      normalized.categories = metadata.categories as string[];
      normalized.tags = [
        ...(normalized.tags as string[] || []),
        ...metadata.categories.map((cat: string) => cat.toLowerCase()),
      ];
    }

    // Normalize primary category
    if (metadata.primaryCategory) {
      normalized.categories = [
        metadata.primaryCategory,
        ...(normalized.categories as string[] || []),
      ];
    }

    // Normalize authors
    if (metadata.authors && Array.isArray(metadata.authors)) {
      normalized.author = metadata.authors[0] as string;
    }

    return normalized;
  }
}

export class KaggleContentNormalizer extends BaseContentNormalizer {
  async normalize(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    const baseNormalized = await super.normalize(content);
    const normalized: Record<string, unknown> = { ...baseNormalized };

    // Kaggle-specific normalization
    const metadata = normalized.metadata as Record<string, unknown> || {};

    // Normalize tags
    if (metadata.tags && Array.isArray(metadata.tags)) {
      normalized.tags = [
        ...(normalized.tags as string[] || []),
        ...metadata.tags.map((tag: string) => tag.toLowerCase()),
      ];
    }

    // Normalize categories from tags
    if (metadata.tags && Array.isArray(metadata.tags)) {
      normalized.categories = metadata.tags.slice(0, 3) as string[];
    }

    return normalized;
  }
}

export class ContentNormalizerFactory {
  static getNormalizer(provider: ContentProvider): ContentNormalizer {
    switch (provider) {
      case 'github':
        return new GitHubContentNormalizer();
      case 'arxiv':
        return new ArXivContentNormalizer();
      case 'kaggle':
        return new KaggleContentNormalizer();
      default:
        return new BaseContentNormalizer();
    }
  }
}
