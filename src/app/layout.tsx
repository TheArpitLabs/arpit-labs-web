import "./globals.css";
import type { Metadata } from "next";
import { seoConfig } from "@/lib/seo";
import { AppShell } from "@/components/layout/AppShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Arpit Labs | Engineering Discovery Platform",
    template: "%s | Arpit Labs"
  },
  description: "A world-class engineering discovery platform. Explore AI, IoT, Software, Hardware, and Cybersecurity projects. Build resilient systems through systems thinking.",
  keywords: ["Arpit Labs", "Engineering", "AI", "IoT", "Hardware", "Software", "Cybersecurity", "Projects", "Discovery"],
  metadataBase: new URL(seoConfig.siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Arpit Labs",
    description: "A world-class engineering discovery platform. Explore projects, research, and collaborate with engineers worldwide.",
    url: seoConfig.siteUrl,
    siteName: "Arpit Labs",
    locale: "en_US",
    type: "website",
    images: [{ url: seoConfig.defaultImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arpit Labs",
    description: "A world-class engineering discovery platform. Explore projects, research, and collaborate with engineers worldwide.",
    creator: "@arpitlabs",
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
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
