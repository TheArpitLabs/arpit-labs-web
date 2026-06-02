import type { Metadata } from "next";

const siteName = "Arpit Labs";
const siteUrl = "https://arpitlabs.example";
const defaultImage = "/og-image.png";

interface CreateMetadataOptions {
  title: string;
  description: string;
  path?: string;
  image?: string;
  keywords?: string[];
}

export function createPageMetadata({
  title,
  description,
  path = "/",
  image = defaultImage,
  keywords = [],
}: CreateMetadataOptions): Metadata {
  const url = new URL(path, siteUrl).toString();

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: "website",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
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
