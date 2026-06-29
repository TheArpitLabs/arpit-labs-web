/**
 * SEO Meta Tag Management
 * Manages SEO meta tags for pages
 */

export interface MetaTags {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  robots?: string;
  author?: string;
  publisher?: string;
  alternateLanguages?: Record<string, string>;
  jsonLd?: any;
}

export interface OpenGraphTags {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  url?: string;
  siteName?: string;
}

export interface TwitterCardTags {
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  title?: string;
  description?: string;
  image?: string;
  site?: string;
}

class MetaTagManager {
  private defaultTags: MetaTags = {};

  /**
   * Sets default meta tags
   */
  setDefaultTags(tags: MetaTags): void {
    this.defaultTags = tags;
  }

  /**
   * Generates meta tags for a page
   */
  generateMetaTags(pageTags: MetaTags): MetaTags {
    return {
      ...this.defaultTags,
      ...pageTags,
      // Ensure OG tags fallback to regular tags
      ogTitle: pageTags.ogTitle || pageTags.title || this.defaultTags.title,
      ogDescription: pageTags.ogDescription || pageTags.description || this.defaultTags.description,
      ogImage: pageTags.ogImage || this.defaultTags.ogImage,
      ogUrl: pageTags.ogUrl || pageTags.canonical || this.defaultTags.canonical,
      // Twitter tags fallback
      twitterTitle: pageTags.twitterTitle || pageTags.title || this.defaultTags.title,
      twitterDescription: pageTags.twitterDescription || pageTags.description || this.defaultTags.description,
      twitterImage: pageTags.twitterImage || pageTags.ogImage || this.defaultTags.ogImage,
    };
  }

  /**
   * Converts meta tags to HTML meta elements
   */
  toHTML(tags: MetaTags): string {
    const elements: string[] = [];

    if (tags.title) {
      elements.push(`<title>${this.escapeHtml(tags.title)}</title>`);
    }

    if (tags.description) {
      elements.push(`<meta name="description" content="${this.escapeHtml(tags.description)}">`);
    }

    if (tags.keywords && tags.keywords.length > 0) {
      elements.push(`<meta name="keywords" content="${tags.keywords.join(', ')}">`);
    }

    if (tags.canonical) {
      elements.push(`<link rel="canonical" href="${this.escapeHtml(tags.canonical)}">`);
    }

    if (tags.robots) {
      elements.push(`<meta name="robots" content="${this.escapeHtml(tags.robots)}">`);
    }

    if (tags.author) {
      elements.push(`<meta name="author" content="${this.escapeHtml(tags.author)}">`);
    }

    if (tags.publisher) {
      elements.push(`<meta name="publisher" content="${this.escapeHtml(tags.publisher)}">`);
    }

    // Open Graph tags
    if (tags.ogTitle) {
      elements.push(`<meta property="og:title" content="${this.escapeHtml(tags.ogTitle)}">`);
    }

    if (tags.ogDescription) {
      elements.push(`<meta property="og:description" content="${this.escapeHtml(tags.ogDescription)}">`);
    }

    if (tags.ogImage) {
      elements.push(`<meta property="og:image" content="${this.escapeHtml(tags.ogImage)}">`);
    }

    if (tags.ogType) {
      elements.push(`<meta property="og:type" content="${this.escapeHtml(tags.ogType)}">`);
    }

    if (tags.ogUrl) {
      elements.push(`<meta property="og:url" content="${this.escapeHtml(tags.ogUrl)}">`);
    }

    // Twitter Card tags
    if (tags.twitterCard) {
      elements.push(`<meta name="twitter:card" content="${tags.twitterCard}">`);
    }

    if (tags.twitterTitle) {
      elements.push(`<meta name="twitter:title" content="${this.escapeHtml(tags.twitterTitle)}">`);
    }

    if (tags.twitterDescription) {
      elements.push(`<meta name="twitter:description" content="${this.escapeHtml(tags.twitterDescription)}">`);
    }

    if (tags.twitterImage) {
      elements.push(`<meta name="twitter:image" content="${this.escapeHtml(tags.twitterImage)}">`);
    }

    // Alternate language links
    if (tags.alternateLanguages) {
      for (const [lang, url] of Object.entries(tags.alternateLanguages)) {
        elements.push(`<link rel="alternate" hreflang="${lang}" href="${this.escapeHtml(url)}">`);
      }
    }

    // JSON-LD structured data
    if (tags.jsonLd) {
      elements.push(`<script type="application/ld+json">${JSON.stringify(tags.jsonLd)}</script>`);
    }

    return elements.join('\n');
  }

  /**
   * Escapes HTML special characters
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Generates JSON-LD structured data
   */
  generateJSONLD(type: 'Organization' | 'Person' | 'Article' | 'WebSite', data: any): any {
    const base: any = {
      '@context': 'https://schema.org',
      '@type': type,
    };

    switch (type) {
      case 'Organization':
        return {
          ...base,
          name: data.name,
          url: data.url,
          logo: data.logo,
          description: data.description,
          address: data.address,
          contactPoint: data.contactPoint,
          sameAs: data.sameAs,
        };

      case 'Person':
        return {
          ...base,
          name: data.name,
          url: data.url,
          image: data.image,
          jobTitle: data.jobTitle,
          worksFor: data.worksFor,
          sameAs: data.sameAs,
        };

      case 'Article':
        return {
          ...base,
          headline: data.headline,
          image: data.image,
          author: data.author,
          publisher: data.publisher,
          datePublished: data.datePublished,
          dateModified: data.dateModified,
          description: data.description,
          mainEntityOfPage: data.mainEntityOfPage,
        };

      case 'WebSite':
        return {
          ...base,
          name: data.name,
          url: data.url,
          description: data.description,
          potentialAction: data.potentialAction,
        };

      default:
        return base;
    }
  }

  /**
   * Generates breadcrumb JSON-LD
   */
  generateBreadcrumbJSONLD(items: Array<{ name: string; url: string }>): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };
  }

  /**
   * Generates FAQ JSON-LD
   */
  generateFAQJSONLD(faqs: Array<{ question: string; answer: string }>): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  /**
   * Validates meta tags
   */
  validate(tags: MetaTags): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (tags.title && tags.title.length > 60) {
      errors.push('Title should be 60 characters or less');
    }

    if (tags.description && tags.description.length > 160) {
      errors.push('Description should be 160 characters or less');
    }

    if (tags.keywords && tags.keywords.length > 10) {
      errors.push('Keywords should be 10 or less');
    }

    if (tags.ogImage && !this.isValidUrl(tags.ogImage)) {
      errors.push('OG image must be a valid URL');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Checks if a string is a valid URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
const metaManager = new MetaTagManager();

/**
 * Sets default meta tags
 */
export function setDefaultMetaTags(tags: MetaTags): void {
  metaManager.setDefaultTags(tags);
}

/**
 * Generates meta tags
 */
export function generateMetaTags(pageTags: MetaTags): MetaTags {
  return metaManager.generateMetaTags(pageTags);
}

/**
 * Converts meta tags to HTML
 */
export function metaTagsToHTML(tags: MetaTags): string {
  return metaManager.toHTML(tags);
}

/**
 * Generates JSON-LD
 */
export function generateJSONLD(type: 'Organization' | 'Person' | 'Article' | 'WebSite', data: any): any {
  return metaManager.generateJSONLD(type, data);
}

/**
 * Generates breadcrumb JSON-LD
 */
export function generateBreadcrumbJSONLD(items: Array<{ name: string; url: string }>): any {
  return metaManager.generateBreadcrumbJSONLD(items);
}

/**
 * Generates FAQ JSON-LD
 */
export function generateFAQJSONLD(faqs: Array<{ question: string; answer: string }>): any {
  return metaManager.generateFAQJSONLD(faqs);
}

/**
 * Validates meta tags
 */
export function validateMetaTags(tags: MetaTags): { valid: boolean; errors: string[] } {
  return metaManager.validate(tags);
}

export default metaManager;
