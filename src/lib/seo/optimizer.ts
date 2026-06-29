/**
 * SEO optimization utilities
 */

export interface MetaTags {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

/**
 * Generate meta tags for a page
 */
export function generateMetaTags(meta: MetaTags): Record<string, string> {
  const tags: Record<string, string> = {};

  // Basic meta tags
  tags['title'] = meta.title;
  tags['description'] = meta.description;

  if (meta.keywords && meta.keywords.length > 0) {
    tags['keywords'] = meta.keywords.join(', ');
  }

  if (meta.canonical) {
    tags['canonical'] = meta.canonical;
  }

  // Open Graph tags
  if (meta.ogTitle) {
    tags['og:title'] = meta.ogTitle;
  } else {
    tags['og:title'] = meta.title;
  }

  if (meta.ogDescription) {
    tags['og:description'] = meta.ogDescription;
  } else {
    tags['og:description'] = meta.description;
  }

  if (meta.ogImage) {
    tags['og:image'] = meta.ogImage;
  }

  if (meta.ogType) {
    tags['og:type'] = meta.ogType;
  }

  // Twitter Card tags
  if (meta.twitterCard) {
    tags['twitter:card'] = meta.twitterCard;
  }

  if (meta.twitterTitle) {
    tags['twitter:title'] = meta.twitterTitle;
  } else if (meta.ogTitle) {
    tags['twitter:title'] = meta.ogTitle;
  } else {
    tags['twitter:title'] = meta.title;
  }

  if (meta.twitterDescription) {
    tags['twitter:description'] = meta.twitterDescription;
  } else if (meta.ogDescription) {
    tags['twitter:description'] = meta.ogDescription;
  } else {
    tags['twitter:description'] = meta.description;
  }

  if (meta.twitterImage) {
    tags['twitter:image'] = meta.twitterImage;
  } else if (meta.ogImage) {
    tags['twitter:image'] = meta.ogImage;
  }

  // Robots meta
  if (meta.noIndex || meta.noFollow) {
    const robotsDirectives = [];
    if (meta.noIndex) robotsDirectives.push('noindex');
    if (meta.noFollow) robotsDirectives.push('nofollow');
    tags['robots'] = robotsDirectives.join(', ');
  }

  return tags;
}

/**
 * Update document meta tags dynamically
 */
export function updateMetaTags(meta: MetaTags): void {
  const tags = generateMetaTags(meta);

  // Update title
  if (tags.title) {
    document.title = tags.title;
  }

  // Update or create meta tags
  Object.entries(tags).forEach(([name, content]) => {
    if (name === 'title') return; // Skip title, already handled

    let metaTag: HTMLMetaElement | null = document.querySelector(
      `meta[name="${name}"]`
    ) as HTMLMetaElement;

    if (!metaTag) {
      // Check for property attribute (Open Graph)
      metaTag = document.querySelector(
        `meta[property="${name}"]`
      ) as HTMLMetaElement;
    }

    if (!metaTag) {
      metaTag = document.createElement('meta');
      
      // Use property for Open Graph tags, name for others
      if (name.startsWith('og:') || name.startsWith('twitter:')) {
        metaTag.setAttribute('property', name);
      } else {
        metaTag.setAttribute('name', name);
      }
      
      document.head.appendChild(metaTag);
    }

    metaTag.setAttribute('content', content);
  });

  // Update canonical link
  if (meta.canonical) {
    let canonicalLink = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;

    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }

    canonicalLink.href = meta.canonical;
  }
}

/**
 * Generate structured data (JSON-LD)
 */
export function generateStructuredData(type: string, data: Record<string, any>): string {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return JSON.stringify(structuredData);
}

/**
 * Add structured data to page
 */
export function addStructuredData(type: string, data: Record<string, any>): void {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = generateStructuredData(type, data);
  document.head.appendChild(script);
}

/**
 * Generate organization structured data
 */
export function generateOrganizationData(data: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
  contactPoint?: {
    telephone?: string;
    email?: string;
    contactType?: string;
  };
}): string {
  return generateStructuredData('Organization', {
    name: data.name,
    url: data.url,
    logo: data.logo,
    description: data.description,
    sameAs: data.sameAs,
    contactPoint: data.contactPoint ? {
      '@type': 'ContactPoint',
      ...data.contactPoint,
    } : undefined,
  });
}

/**
 * Generate website structured data
 */
export function generateWebsiteData(data: {
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    target: string;
    queryInput?: string;
  };
}): string {
  return generateStructuredData('WebSite', {
    name: data.name,
    url: data.url,
    description: data.description,
    potentialAction: data.potentialAction ? {
      '@type': 'SearchAction',
      target: data.potentialAction.target,
      'query-input': data.potentialAction.queryInput || 'required name=search_term_string',
    } : undefined,
  });
}

/**
 * Generate article structured data
 */
export function generateArticleData(data: {
  headline: string;
  image?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
  description?: string;
}): string {
  return generateStructuredData('Article', {
    headline: data.headline,
    image: data.image,
    author: data.author ? {
      '@type': 'Person',
      name: data.author,
    } : undefined,
    datePublished: data.datePublished,
    dateModified: data.dateModified,
    description: data.description,
  });
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbData(items: Array<{
  name: string;
  url: string;
}>): string {
  return generateStructuredData('BreadcrumbList', {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

/**
 * Optimize images for SEO
 */
export function optimizeImageForSEO(
  src: string,
  alt: string,
  title?: string
): { src: string; alt: string; title?: string } {
  return {
    src,
    alt: alt || '',
    title: title || alt,
  };
}

/**
 * Generate SEO-friendly URL slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Check if page is indexed
 */
export function isPageIndexed(): boolean {
  const robotsMeta = document.querySelector('meta[name="robots"]');
  if (!robotsMeta) return true;

  const content = robotsMeta.getAttribute('content') || '';
  return !content.includes('noindex');
}

/**
 * Get current SEO score
 */
export function getSEOScore(): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check title
  const title = document.title;
  if (!title) {
    issues.push('Missing page title');
    score -= 20;
  } else if (title.length < 30) {
    suggestions.push('Title should be at least 30 characters');
    score -= 5;
  } else if (title.length > 60) {
    suggestions.push('Title should be under 60 characters');
    score -= 5;
  }

  // Check description
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
  if (!description) {
    issues.push('Missing meta description');
    score -= 20;
  } else if (description.length < 120) {
    suggestions.push('Description should be at least 120 characters');
    score -= 5;
  } else if (description.length > 160) {
    suggestions.push('Description should be under 160 characters');
    score -= 5;
  }

  // Check canonical URL
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
  if (!canonical) {
    suggestions.push('Consider adding a canonical URL');
    score -= 5;
  }

  // Check Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');

  if (!ogTitle || !ogDescription || !ogImage) {
    suggestions.push('Add Open Graph tags for better social sharing');
    score -= 10;
  }

  // Check heading structure
  const h1Count = document.querySelectorAll('h1').length;
  if (h1Count === 0) {
    issues.push('Missing H1 heading');
    score -= 15;
  } else if (h1Count > 1) {
    suggestions.push('Use only one H1 heading per page');
    score -= 5;
  }

  // Check images
  const images = document.querySelectorAll('img');
  let imagesWithoutAlt = 0;
  images.forEach(img => {
    if (!img.getAttribute('alt')) {
      imagesWithoutAlt++;
    }
  });

  if (imagesWithoutAlt > 0) {
    issues.push(`${imagesWithoutAlt} images missing alt text`);
    score -= imagesWithoutAlt * 2;
  }

  return {
    score: Math.max(0, score),
    issues,
    suggestions,
  };
}

/**
 * Generate sitemap URL entry
 */
export function generateSitemapEntry(
  url: string,
  lastModified?: Date,
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
  priority?: number
): string {
  const entry = `
    <url>
      <loc>${url}</loc>
      ${lastModified ? `<lastmod>${lastModified.toISOString()}</lastmod>` : ''}
      ${changeFrequency ? `<changefreq>${changeFrequency}</changefreq>` : ''}
      ${priority !== undefined ? `<priority>${priority}</priority>` : ''}
    </url>
  `;
  return entry;
}
