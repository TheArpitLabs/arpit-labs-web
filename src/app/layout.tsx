import "./globals.css";
import { ThemeProvider } from "next-themes";
import type { Metadata } from "next";
import { seoConfig } from "@/lib/seo";
import { Navbar } from "@/components/layout/Navbar";

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
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
