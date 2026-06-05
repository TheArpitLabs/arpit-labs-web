import "./globals.css";
import { ThemeProvider } from "next-themes";
import type { Metadata } from "next";
import { seoConfig } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Arpit Labs | Engineering the Future",
    template: "%s | Arpit Labs"
  },
  description: "A digital engineering lab exploring AI, IoT, Software, and Hardware. Building resilient systems through systems thinking.",
  keywords: ["Arpit Labs", "AI", "IoT", "Engineering", "Hardware", "Software", "Cybersecurity"],
  metadataBase: new URL(seoConfig.siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Arpit Labs",
    description: "Engineering the future through AI, IoT, and Systems Thinking.",
    url: seoConfig.siteUrl,
    siteName: "Arpit Labs",
    locale: "en_US",
    type: "website",
    images: [{ url: seoConfig.defaultImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arpit Labs",
    description: "Engineering the future through AI, IoT, and Systems Thinking.",
    creator: "@arpitlabs",
    images: [seoConfig.defaultImage],
  },
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              "name": "Arpit Labs",
              "description": "Digital engineering lab for AI, IoT, and high-performance software.",
              "url": seoConfig.siteUrl,
              "founder": {
                "@type": "Person",
                "name": "Arpit"
              },
              "knowsAbout": ["AI", "IoT", "Software Engineering", "Hardware Design", "Cybersecurity"]
            })
          }}
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
