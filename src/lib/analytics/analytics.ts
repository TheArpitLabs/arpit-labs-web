/**
 * Analytics Configuration
 * Integrates Google Analytics 4 and Vercel Analytics
 */

import { logger } from '@/lib/logger';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Google Analytics 4 Events
export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || '';

export function initializeGA4() {
  if (!GA4_ID) {
    logger.warn('GA4_ID not configured');
    return;
  }

  // Google Analytics script is loaded in layout
  if (window.gtag) {
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
    });
  }
}

export function grantAnalyticsConsent() {
  if (window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'granted',
    });
  }
}

export function trackPageView(path: string, title: string) {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
    });
  }
}

export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
) {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Specific tracking events
export const analytics = {
  projectView: (projectSlug: string, projectTitle: string) =>
    trackEvent('engagement', 'view_project', projectSlug, 1),

  articleView: (articleSlug: string, articleTitle: string) =>
    trackEvent('engagement', 'view_article', articleSlug, 1),

  experimentView: (experimentSlug: string) =>
    trackEvent('engagement', 'view_experiment', experimentSlug, 1),

  productView: (productSlug: string) =>
    trackEvent('engagement', 'view_product', productSlug, 1),

  productClick: (productSlug: string) =>
    trackEvent('engagement', 'click_product', productSlug, 1),

  demoOpen: (productSlug: string) =>
    trackEvent('engagement', 'open_demo', productSlug, 1),

  docsOpen: (productSlug: string) =>
    trackEvent('engagement', 'open_docs', productSlug, 1),

  contactSubmit: () =>
    trackEvent('conversion', 'contact_form_submit', 'contact_form', 1),

  newsletterSignup: () =>
    trackEvent('conversion', 'newsletter_signup', 'newsletter', 1),

  // PAYMENTS TEMPORARILY DISABLED - Membership tracking disabled
  planUpgrade: (planSlug: string) => {
    // No-op - membership tracking disabled
  },

  planDowngrade: (planSlug: string) => {
    // No-op - membership tracking disabled
  },

  featureUsage: (featureKey: string, planSlug?: string) =>
    trackEvent('engagement', 'feature_usage', featureKey, 1),

  aiUsageByPlan: (featureKey: string, planSlug: string) =>
    trackEvent('ai', 'ai_usage', featureKey, 1),

  downloadResume: () =>
    trackEvent('conversion', 'download_resume', 'resume', 1),

  externalLink: (url: string) =>
    trackEvent('engagement', 'external_link_click', url, 1),

  codeSnippetCopy: (language: string) =>
    trackEvent('engagement', 'copy_code', language, 1),

  timeOnPage: (page: string, seconds: number) =>
    trackEvent('engagement', 'time_on_page', page, Math.round(seconds)),

  scrollDepth: (percentage: number) =>
    trackEvent('engagement', 'scroll_depth', `${percentage}%`, percentage),
};
