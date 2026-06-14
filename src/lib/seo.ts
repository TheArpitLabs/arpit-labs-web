import type { Metadata } from "next";

const siteName = "Arpit Labs";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://arpit-labs.com";
const defaultImage = `${siteUrl}/logo.png`;
const siteDescription = "Engineering platform showcasing AI, IoT, Cybersecurity, and Web Development projects.";

interface CreateMetadataOptions {
  title: string;
  description: string;
  path?: string;
  image?: string;
  keywords?: string[];
  type?: "website" | "article";
  publishedAt?: Date;
  updatedAt?: Date;
}

export function createPageMetadata({
  title,
  description,
  path = "/",
  image = defaultImage,
  keywords = [],
  type = "website",
  publishedAt,
  updatedAt,
}: CreateMetadataOptions): Metadata {
  const url = new URL(path, siteUrl).toString();
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  return {
    title: fullTitle,
    description,
    keywords: [...keywords, 'AI', 'IoT', 'Cybersecurity', 'Web Development'],
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName,
      type: type === "article" ? "article" : "website",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      ...(type === "article" && publishedAt && { publishedTime: publishedAt.toISOString() }),
      ...(type === "article" && updatedAt && { modifiedTime: updatedAt.toISOString() }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      creator: "@arpitlabs",
      images: [image],
    },
  };
}

export function createArticleMetadata({
  title,
  description,
  path,
  image = defaultImage,
  keywords = [],
}: CreateMetadataOptions): Metadata {
  const metadata = createPageMetadata({ title, description, path, image, keywords });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
    },
  };
}

export const seoConfig = {
  siteName,
  siteUrl,
  defaultImage,
};
