"use client";

import { useEffect } from "react";
import { analytics } from "@/lib/analytics";

interface ProductTrackerProps {
  slug: string;
}

export function ProductTracker({ slug }: ProductTrackerProps) {
  useEffect(() => {
    analytics.productView(slug);
  }, [slug]);

  return null;
}

export function TrackProductClick({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <div onClick={() => analytics.productClick(slug)}>
      {children}
    </div>
  );
}
