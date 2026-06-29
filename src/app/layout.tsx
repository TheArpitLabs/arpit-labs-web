import "./globals.css";
import type { Metadata } from "next";
import { seoConfig } from "@/lib/seo";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalErrorHandler } from "@/components/GlobalErrorHandler";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Axiora",
    template: "%s | Axiora"
  },
  description: "AI-powered innovation platform for projects, research, community, courses, marketplace, and autonomous discovery.",
  keywords: ["Axiora", "AI", "Innovation", "Projects", "Research", "Community", "Courses", "Marketplace", "Discovery"],
  metadataBase: new URL(seoConfig.siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Axiora",
    description: "AI-powered innovation platform for projects, research, community, courses, marketplace, and autonomous discovery.",
    url: seoConfig.siteUrl,
    siteName: "Axiora",
    locale: "en_US",
    type: "website",
    images: [{ url: seoConfig.defaultImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Axiora",
    description: "AI-powered innovation platform for projects, research, community, courses, marketplace, and autonomous discovery.",
    creator: "@axiora",
    images: [seoConfig.defaultImage],
  },
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          Skip to main content
        </a>
        <GlobalErrorHandler />
        <ErrorBoundary>
          <AppShell>
            {children}
          </AppShell>
        </ErrorBoundary>
      </body>
    </html>
  );
}
