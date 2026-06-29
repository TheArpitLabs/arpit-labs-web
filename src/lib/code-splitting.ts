import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import { Spinner } from '@/components/ui/loading';

/**
 * Code splitting configuration for heavy components
 * This improves initial load performance by loading components on demand
 */

// Admin components - typically heavy and only needed on admin pages
export const ProjectDiscoveryEngine = dynamic(
  () => import('@/components/admin/ProjectDiscoveryEngine').then(mod => ({ default: mod.ProjectDiscoveryEngine })),
  { 
    loading: () => Spinner({ size: 'default', className: 'mx-auto my-8' }),
    ssr: false // Client-side only for better performance
  }
);

export const AdminAnalyticsDashboard = dynamic(
  () => import('@/components/admin/AdminAnalyticsDashboard').then(mod => ({ default: mod.AdminAnalyticsDashboard })),
  { 
    loading: () => Spinner({ size: 'default', className: 'mx-auto my-8' }),
    ssr: false
  }
);

export const RichTextEditor = dynamic(
  () => import('@/components/admin/RichTextEditor').then(mod => ({ default: mod.RichTextEditor })),
  { 
    loading: () => Spinner({ size: 'default', className: 'mx-auto my-8' }),
    ssr: false
  }
);

export const ContributorManager = dynamic(
  () => import('@/components/admin/ContributorManager').then(mod => ({ default: mod.ContributorManager })),
  { 
    loading: () => Spinner({ size: 'default', className: 'mx-auto my-8' }),
    ssr: false
  }
);

// AI components - typically heavy and only needed when AI features are used
export const AIChat = dynamic(
  () => import('@/components/ai/AIChat').then(mod => ({ default: mod.AIChat })),
  { 
    loading: () => Spinner({ size: 'default', className: 'mx-auto my-8' }),
    ssr: false
  }
);

// Analytics components - heavy chart libraries
export const ProductTracker = dynamic(
  () => import('@/components/analytics/ProductTracker').then(mod => ({ default: mod.ProductTracker })),
  { 
    loading: () => Spinner({ size: 'default', className: 'mx-auto my-8' }),
    ssr: false
  }
);

// Dashboard components - can be heavy with lots of data
export const DashboardLayout = dynamic(
  () => import('@/components/dashboard/DashboardLayout').then(mod => ({ default: mod.DashboardLayout })),
  { 
    loading: () => Spinner({ size: 'default', className: 'mx-auto my-8' }),
    ssr: true // SSR for SEO
  }
);

// Form components - can be heavy with validation
export const ProjectForm = dynamic(
  () => import('@/components/admin/ProjectForm').then(mod => ({ default: mod.ProjectForm })),
  { 
    loading: () => Spinner({ size: 'default', className: 'mx-auto my-8' }),
    ssr: false
  }
);

export const BlogForm = dynamic(
  () => import('@/components/admin/BlogForm').then(mod => ({ default: mod.BlogForm })),
  { 
    loading: () => Spinner({ size: 'default', className: 'mx-auto my-8' }),
    ssr: false
  }
);

export const CourseForm = dynamic(
  () => import('@/components/admin/CourseForm').then(mod => ({ default: mod.CourseForm })),
  { 
    loading: () => Spinner({ size: 'default', className: 'mx-auto my-8' }),
    ssr: false
  }
);

/**
 * Helper function to create a dynamically loaded component with custom loading state
 */
export function createDynamicComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  loadingComponent?: React.ReactNode,
  options?: { ssr?: boolean }
) {
  return dynamic(importFn, {
    loading: () => loadingComponent || Spinner({ size: 'default', className: 'mx-auto my-8' }),
    ssr: options?.ssr ?? true,
  });
}

/**
 * Preload components for better UX when they're likely to be needed
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  // Start loading the component in the background
  importFn();
}

/**
 * Group of components that should be preloaded together
 */
export function preloadAdminComponents() {
  preloadComponent(() => import('@/components/admin/ProjectDiscoveryEngine').then(mod => ({ default: mod.ProjectDiscoveryEngine })));
  preloadComponent(() => import('@/components/admin/AdminAnalyticsDashboard').then(mod => ({ default: mod.AdminAnalyticsDashboard })));
  preloadComponent(() => import('@/components/admin/RichTextEditor').then(mod => ({ default: mod.RichTextEditor })));
}

export function preloadAIComponents() {
  preloadComponent(() => import('@/components/ai/AIChat').then(mod => ({ default: mod.AIChat })));
}

export function preloadDashboardComponents() {
  preloadComponent(() => import('@/components/dashboard/DashboardLayout').then(mod => ({ default: mod.DashboardLayout })));
  preloadComponent(() => import('@/components/analytics/ProductTracker').then(mod => ({ default: mod.ProductTracker })));
}
