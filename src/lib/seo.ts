export interface OpenGraphOptions {
  title: string;
  description: string;
  url: string;
  image?: string;
  siteName?: string;
}

export interface TwitterCardOptions extends OpenGraphOptions {
  card?: "summary" | "summary_large_image" | "app" | "player";
  creator?: string;
}

export function buildMetadata(options: OpenGraphOptions) {
  return {
    title: options.title,
    description: options.description,
    openGraph: {
      title: options.title,
      description: options.description,
      url: options.url,
      siteName: options.siteName ?? "Arpit Labs",
      images: options.image ? [{ url: options.image }] : []
    }
  };
}

export function buildTwitterMetadata(options: TwitterCardOptions) {
  return {
    twitter: {
      card: options.card ?? "summary_large_image",
      title: options.title,
      description: options.description,
      creator: options.creator ?? "@arpitlabs"
    }
  };
}

export function buildCanonicalUrl(url: string) {
  return { canonical: url };
}

export function buildStructuredData(data: Record<string, unknown>) {
  return {
    structuredData: data
  };
}
