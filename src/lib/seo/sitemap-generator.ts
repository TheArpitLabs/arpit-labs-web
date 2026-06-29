/**
 * Sitemap generation utilities
 */

export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface SitemapConfig {
  baseUrl: string;
  defaultChangeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  defaultPriority?: number;
}

/**
 * Generate sitemap XML
 */
export function generateSitemap(entries: SitemapEntry[], config: SitemapConfig): string {
  const { baseUrl, defaultChangeFrequency = 'weekly', defaultPriority = 0.5 } = config;

  const xmlEntries = entries.map(entry => {
    const url = entry.url.startsWith('http') ? entry.url : `${baseUrl}${entry.url}`;
    const lastMod = entry.lastModified ? entry.lastModified.toISOString() : undefined;
    const changeFreq = entry.changeFrequency || defaultChangeFrequency;
    const priority = entry.priority !== undefined ? entry.priority : defaultPriority;

    return `    <url>
      <loc>${url}</loc>
      ${lastMod ? `<lastmod>${lastMod}</lastmod>` : ''}
      <changefreq>${changeFreq}</changefreq>
      <priority>${priority}</priority>
    </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}

/**
 * Generate sitemap index for multiple sitemaps
 */
export function generateSitemapIndex(sitemaps: Array<{
  url: string;
  lastModified: Date;
}>): string {
  const xmlEntries = sitemaps.map(sitemap => {
    return `    <sitemap>
      <loc>${sitemap.url}</loc>
      <lastmod>${sitemap.lastModified.toISOString()}</lastmod>
    </sitemap>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</sitemapindex>`;
}

/**
 * Generate sitemap from routes
 */
export function generateSitemapFromRoutes(routes: string[], config: SitemapConfig): string {
  const entries: SitemapEntry[] = routes.map(route => ({
    url: route,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return generateSitemap(entries, config);
}

/**
 * Generate sitemap for dynamic content
 */
export function generateDynamicSitemap(
  items: Array<{
    slug: string;
    updatedAt: Date;
  }>,
  basePath: string,
  config: SitemapConfig
): string {
  const entries: SitemapEntry[] = items.map(item => ({
    url: `${basePath}/${item.slug}`,
    lastModified: item.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return generateSitemap(entries, config);
}

/**
 * Generate sitemap with pagination
 */
export function generatePaginatedSitemap(
  baseUrl: string,
  totalItems: number,
  itemsPerPage: number,
  config: SitemapConfig
): string {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const entries: SitemapEntry[] = [];

  for (let page = 1; page <= totalPages; page++) {
    entries.push({
      url: page === 1 ? baseUrl : `${baseUrl}?page=${page}`,
      changeFrequency: 'daily',
      priority: page === 1 ? 0.9 : 0.7,
    });
  }

  return generateSitemap(entries, config);
}

/**
 * Validate sitemap XML
 */
export function validateSitemap(xml: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!xml.includes('<?xml version="1.0"')) {
    errors.push('Missing XML declaration');
  }

  if (!xml.includes('<urlset')) {
    errors.push('Missing urlset element');
  }

  if (!xml.includes('</urlset>')) {
    errors.push('Missing closing urlset tag');
  }

  if (!xml.includes('<url>')) {
    errors.push('No URL entries found');
  }

  if (!xml.includes('<loc>')) {
    errors.push('Missing loc elements');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Compress sitemap for large sitemaps
 */
export function compressSitemap(xml: string): string {
  // Remove unnecessary whitespace
  return xml
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split sitemap into multiple files if too large
 */
export function splitSitemap(
  sitemap: string,
  maxSize: number = 50000 // 50KB limit
): string[] {
  if (sitemap.length <= maxSize) {
    return [sitemap];
  }

  const sitemaps: string[] = [];
  const urlRegex = /<url>[\s\S]*?<\/url>/g;
  const urls = sitemap.match(urlRegex) || [];

  let currentSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  let currentSize = currentSitemap.length;

  urls.forEach(url => {
    if (currentSize + url.length > maxSize) {
      currentSitemap += '\n</urlset>';
      sitemaps.push(currentSitemap);
      currentSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
      currentSize = currentSitemap.length;
    }

    currentSitemap += `\n${url}`;
    currentSize += url.length;
  });

  currentSitemap += '\n</urlset>';
  sitemaps.push(currentSitemap);

  return sitemaps;
}

/**
 * Generate sitemap for images
 */
export function generateImageSitemap(
  images: Array<{
    url: string;
    caption?: string;
    title?: string;
    geoLocation?: string;
    license?: string;
  }>,
  pageUrl: string
): string {
  const xmlEntries = images.map(image => {
    return `      <image:image>
        <image:loc>${image.url}</image:loc>
        ${image.caption ? `<image:caption>${image.caption}</image:caption>` : ''}
        ${image.title ? `<image:title>${image.title}</image:title>` : ''}
        ${image.geoLocation ? `<image:geo_location>${image.geoLocation}</image:geo_location>` : ''}
        ${image.license ? `<image:license>${image.license}</image:license>` : ''}
      </image:image>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${pageUrl}</loc>
${xmlEntries}
  </url>
</urlset>`;
}

/**
 * Generate sitemap for videos
 */
export function generateVideoSitemap(
  videos: Array<{
    thumbnail: string;
    title: string;
    description: string;
    contentUrl: string;
    duration: number;
    uploadDate: Date;
  }>,
  pageUrl: string
): string {
  const xmlEntries = videos.map(video => {
    return `      <video:video>
        <video:thumbnail_loc>${video.thumbnail}</video:thumbnail_loc>
        <video:title>${video.title}</video:title>
        <video:description>${video.description}</video:description>
        <video:content_loc>${video.contentUrl}</video:content_loc>
        <video:duration>${video.duration}</video:duration>
        <video:upload_date>${video.uploadDate.toISOString()}</video:upload_date>
      </video:video>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  <url>
    <loc>${pageUrl}</loc>
${xmlEntries}
  </url>
</urlset>`;
}

/**
 * Generate sitemap for news
 */
export function generateNewsSitemap(
  articles: Array<{
    url: string;
    title: string;
    publicationDate: Date;
    publicationName: string;
    language: string;
  }>
): string {
  const xmlEntries = articles.map(article => {
    return `    <url>
      <loc>${article.url}</loc>
      <news:news>
        <news:publication>
          <news:name>${article.publicationName}</news:name>
          <news:language>${article.language}</news:language>
        </news:publication>
        <news:publication_date>${article.publicationDate.toISOString()}</news:publication_date>
        <news:title>${article.title}</news:title>
      </news:news>
    </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${xmlEntries}
</urlset>`;
}

/**
 * Get sitemap statistics
 */
export function getSitemapStats(sitemap: string): {
  size: number;
  urlCount: number;
  estimatedLoadTime: number;
} {
  const urlCount = (sitemap.match(/<url>/g) || []).length;
  const size = sitemap.length;
  const estimatedLoadTime = size / 1000; // Rough estimate in seconds

  return {
    size,
    urlCount,
    estimatedLoadTime,
  };
}
