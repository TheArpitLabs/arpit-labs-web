/**
 * Content Extractor
 * 
 * Extracts structured content from raw data
 */

import { ContentExtractor } from './types';
import { ContentType } from '../source-discovery/types';

export class BaseContentExtractor implements ContentExtractor {
  /**
   * Extract content from raw data
   */
  async extract(content: Record<string, unknown>): Promise<{
    extractedContent: string;
    metadata: Record<string, unknown>;
  }> {
    const extractedContent = this.buildExtractedContent(content);
    const metadata = this.extractMetadata(content);

    return {
      extractedContent,
      metadata,
    };
  }

  /**
   * Build extracted content string
   */
  protected buildExtractedContent(content: Record<string, unknown>): string {
    const parts: string[] = [];

    if (content.title) {
      parts.push(`# ${content.title}`);
    }

    if (content.description) {
      parts.push(`\n${content.description}`);
    }

    if (content.rawContent) {
      parts.push(`\n${content.rawContent}`);
    }

    if (content.author) {
      parts.push(`\n\nAuthor: ${content.author}`);
    }

    if (content.tags && Array.isArray(content.tags) && content.tags.length > 0) {
      parts.push(`\n\nTags: ${content.tags.join(', ')}`);
    }

    return parts.join('\n');
  }

  /**
   * Extract metadata
   */
  protected extractMetadata(content: Record<string, unknown>): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    if (content.metadata) {
      Object.assign(metadata, content.metadata);
    }

    // Add extracted metadata
    metadata.hasReadme = !!(content.rawContent);
    metadata.hasDescription = !!(content.description);
    metadata.hasAuthor = !!(content.author);
    metadata.hasTags = !!(content.tags && Array.isArray(content.tags) && content.tags.length > 0);
    metadata.tagCount = content.tags && Array.isArray(content.tags) ? content.tags.length : 0;
    metadata.titleLength = content.title ? (content.title as string).length : 0;
    metadata.descriptionLength = content.description ? (content.description as string).length : 0;
    metadata.contentLength = content.rawContent ? (content.rawContent as string).length : 0;

    return metadata;
  }
}

export class GitHubContentExtractor extends BaseContentExtractor {
  protected buildExtractedContent(content: Record<string, unknown>): string {
    const parts: string[] = [];

    if (content.title) {
      parts.push(`# ${content.title}`);
    }

    if (content.description) {
      parts.push(`\n${content.description}`);
    }

    if (content.rawContent) {
      parts.push(`\n${content.rawContent}`);
    }

    const metadata = content.metadata as Record<string, unknown> || {};

    if (metadata.readme) {
      parts.push(`\n\n## README\n${metadata.readme}`);
    }

    if (metadata.languages) {
      const languages = Object.keys(metadata.languages as Record<string, unknown>);
      if (languages.length > 0) {
        parts.push(`\n\n## Languages\n${languages.join(', ')}`);
      }
    }

    if (metadata.topics && Array.isArray(metadata.topics) && metadata.topics.length > 0) {
      parts.push(`\n\n## Topics\n${metadata.topics.join(', ')}`);
    }

    if (content.author) {
      parts.push(`\n\n## Author\n${content.author}`);
    }

    if (metadata.stars) {
      parts.push(`\n\n## Stats\n- Stars: ${metadata.stars}\n- Forks: ${metadata.forks || 0}\n- Watchers: ${metadata.watchers || 0}`);
    }

    return parts.join('\n');
  }

  protected extractMetadata(content: Record<string, unknown>): Record<string, unknown> {
    const metadata = super.extractMetadata(content);
    const contentMetadata = content.metadata as Record<string, unknown> || {};

    metadata.hasReadme = !!(contentMetadata.readme);
    metadata.hasLicense = !!(contentMetadata.license);
    metadata.hasTopics = !!(contentMetadata.topics && Array.isArray(contentMetadata.topics) && contentMetadata.topics.length > 0);
    metadata.starCount = contentMetadata.stars || 0;
    metadata.forkCount = contentMetadata.forks || 0;
    metadata.watcherCount = contentMetadata.watchers || 0;
    metadata.openIssuesCount = contentMetadata.openIssues || 0;
    metadata.languageCount = contentMetadata.languages ? Object.keys(contentMetadata.languages as Record<string, unknown>).length : 0;
    metadata.topicCount = contentMetadata.topics && Array.isArray(contentMetadata.topics) ? contentMetadata.topics.length : 0;

    return metadata;
  }
}

export class ArXivContentExtractor extends BaseContentExtractor {
  protected buildExtractedContent(content: Record<string, unknown>): string {
    const parts: string[] = [];

    if (content.title) {
      parts.push(`# ${content.title}`);
    }

    if (content.description) {
      parts.push(`\n## Abstract\n${content.description}`);
    }

    const metadata = content.metadata as Record<string, unknown> || {};

    if (metadata.authors && Array.isArray(metadata.authors)) {
      parts.push(`\n\n## Authors\n${metadata.authors.join(', ')}`);
    }

    if (metadata.categories && Array.isArray(metadata.categories)) {
      parts.push(`\n\n## Categories\n${metadata.categories.join(', ')}`);
    }

    if (metadata.published) {
      parts.push(`\n\n## Published\n${metadata.published}`);
    }

    return parts.join('\n');
  }

  protected extractMetadata(content: Record<string, unknown>): Record<string, unknown> {
    const metadata = super.extractMetadata(content);
    const contentMetadata = content.metadata as Record<string, unknown> || {};

    metadata.authorCount = contentMetadata.authors && Array.isArray(contentMetadata.authors) ? contentMetadata.authors.length : 0;
    metadata.categoryCount = contentMetadata.categories && Array.isArray(contentMetadata.categories) ? contentMetadata.categories.length : 0;
    metadata.hasPrimaryCategory = !!(contentMetadata.primaryCategory);
    metadata.publicationDate = contentMetadata.published;

    return metadata;
  }
}

export class KaggleContentExtractor extends BaseContentExtractor {
  protected buildExtractedContent(content: Record<string, unknown>): string {
    const parts: string[] = [];

    if (content.title) {
      parts.push(`# ${content.title}`);
    }

    if (content.description) {
      parts.push(`\n${content.description}`);
    }

    const metadata = content.metadata as Record<string, unknown> || {};

    if (metadata.totalDownloads) {
      parts.push(`\n\n## Downloads\n${metadata.totalDownloads}`);
    }

    if (metadata.totalVotes) {
      parts.push(`\n\n## Votes\n${metadata.totalVotes}`);
    }

    if (metadata.usability) {
      parts.push(`\n\n## Usability Rating\n${metadata.usability}`);
    }

    if (content.author) {
      parts.push(`\n\n## Author\n${content.author}`);
    }

    return parts.join('\n');
  }

  protected extractMetadata(content: Record<string, unknown>): Record<string, unknown> {
    const metadata = super.extractMetadata(content);
    const contentMetadata = content.metadata as Record<string, unknown> || {};

    metadata.downloadCount = contentMetadata.totalDownloads || 0;
    metadata.voteCount = contentMetadata.totalVotes || 0;
    metadata.usabilityRating = contentMetadata.usability || 0;
    metadata.hasSize = !!(contentMetadata.size);
    metadata.hasLicense = !!(contentMetadata.licenseName);

    return metadata;
  }
}

export class ContentExtractorFactory {
  static getExtractor(contentType: ContentType, provider: string): ContentExtractor {
    switch (provider) {
      case 'github':
        return new GitHubContentExtractor();
      case 'arxiv':
        return new ArXivContentExtractor();
      case 'kaggle':
        return new KaggleContentExtractor();
      default:
        return new BaseContentExtractor();
    }
  }
}
