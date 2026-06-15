/**
 * Content Validator
 * 
 * Validates content before acquisition
 */

import { ContentValidator } from './types';
import { ContentType } from '../source-discovery/types';

export class BaseContentValidator implements ContentValidator {
  /**
   * Validate content
   */
  async validate(content: Record<string, unknown>): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    const requiredFields = ['title', 'sourceUrl', 'contentType'];
    for (const field of requiredFields) {
      if (!content[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate title
    if (content.title && typeof content.title === 'string') {
      if (content.title.length < 3) {
        errors.push('Title must be at least 3 characters');
      }
      if (content.title.length > 500) {
        warnings.push('Title is very long (>500 characters)');
      }
    }

    // Validate description
    if (content.description && typeof content.description === 'string') {
      if (content.description.length < 10) {
        warnings.push('Description is very short (<10 characters)');
      }
    }

    // Validate URL
    if (content.sourceUrl && typeof content.sourceUrl === 'string') {
      try {
        new URL(content.sourceUrl);
      } catch {
        errors.push('Invalid source URL');
      }
    }

    // Validate content type
    if (content.contentType) {
      const validTypes: ContentType[] = ['project', 'research_paper', 'dataset', 'learning_resource', 'hackathon', 'repository'];
      if (!validTypes.includes(content.contentType as ContentType)) {
        errors.push(`Invalid content type: ${content.contentType}`);
      }
    }

    // Validate tags
    if (content.tags && Array.isArray(content.tags)) {
      if (content.tags.length > 20) {
        warnings.push('Too many tags (>20)');
      }
      for (const tag of content.tags) {
        if (typeof tag !== 'string' || tag.length > 50) {
          errors.push(`Invalid tag: ${tag}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export class ProjectContentValidator extends BaseContentValidator {
  async validate(content: Record<string, unknown>): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const result = await super.validate(content);

    // Project-specific validation
    if (content.contentType === 'project') {
      if (!content.metadata) {
        result.warnings.push('Project missing metadata');
      }

      const metadata = content.metadata as Record<string, unknown>;
      
      if (!metadata.languages && !metadata.tech_stack) {
        result.warnings.push('Project missing technology stack information');
      }

      if (!metadata.githubUrl && !metadata.repositoryUrl) {
        result.errors.push('Project must have a repository URL');
      }
    }

    return result;
  }
}

export class ResearchPaperValidator extends BaseContentValidator {
  async validate(content: Record<string, unknown>): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const result = await super.validate(content);

    // Research paper-specific validation
    if (content.contentType === 'research_paper') {
      if (!content.author) {
        result.errors.push('Research paper must have author information');
      }

      const metadata = content.metadata as Record<string, unknown>;
      
      if (!metadata.published && !metadata.publicationDate) {
        result.warnings.push('Research paper missing publication date');
      }

      if (!metadata.categories || !metadata.primaryCategory) {
        result.warnings.push('Research paper missing category information');
      }
    }

    return result;
  }
}

export class DatasetValidator extends BaseContentValidator {
  async validate(content: Record<string, unknown>): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const result = await super.validate(content);

    // Dataset-specific validation
    if (content.contentType === 'dataset') {
      const metadata = content.metadata as Record<string, unknown>;
      
      if (!metadata.size && !metadata.fileSize) {
        result.warnings.push('Dataset missing size information');
      }

      if (!metadata.licenseName && !metadata.license) {
        result.warnings.push('Dataset missing license information');
      }
    }

    return result;
  }
}

export class ContentValidatorFactory {
  static getValidator(contentType: ContentType): ContentValidator {
    switch (contentType) {
      case 'project':
        return new ProjectContentValidator();
      case 'research_paper':
        return new ResearchPaperValidator();
      case 'dataset':
        return new DatasetValidator();
      default:
        return new BaseContentValidator();
    }
  }
}
