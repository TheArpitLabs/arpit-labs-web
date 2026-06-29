/**
 * Bundle size optimization utilities
 */

export interface BundleAnalysis {
  size: number;
  gzipSize: number;
  modules: Array<{
    name: string;
    size: number;
    percentage: number;
  }>;
  recommendations: string[];
}

/**
 * Analyze bundle size
 */
export function analyzeBundleSize(bundleContent: string): BundleAnalysis {
  const size = bundleContent.length;
  const gzipSize = Math.floor(size * 0.3); // Estimate gzip compression

  // Simple module analysis (would need actual bundler integration)
  const modules: Array<{ name: string; size: number; percentage: number }> = [
    { name: 'react', size: Math.floor(size * 0.2), percentage: 20 },
    { name: 'next', size: Math.floor(size * 0.15), percentage: 15 },
    { name: 'supabase', size: Math.floor(size * 0.1), percentage: 10 },
    { name: 'other', size: Math.floor(size * 0.55), percentage: 55 },
  ];

  const recommendations: string[] = [];

  if (size > 500000) {
    recommendations.push('Bundle size is large. Consider code splitting.');
  }

  if (gzipSize > 150000) {
    recommendations.push('Gzipped bundle is large. Review dependencies.');
  }

  modules.forEach(module => {
    if (module.percentage > 30) {
      recommendations.push(`${module.name} takes ${module.percentage}% of bundle. Consider lazy loading.`);
    }
  });

  return {
    size,
    gzipSize,
    modules,
    recommendations,
  };
}

/**
 * Check for large dependencies
 */
export function checkLargeDependencies(dependencies: Record<string, string>): string[] {
  const largeDeps = [
    'moment', // Use dayjs or date-fns instead
    'lodash', // Use lodash-es or individual packages
    'rxjs', // Consider if full RxJS is needed
    'three', // Consider if full Three.js is needed
    'pdfjs-dist', // Consider lighter alternatives
  ];

  const warnings: string[] = [];

  Object.keys(dependencies).forEach(dep => {
    if (largeDeps.includes(dep)) {
      warnings.push(`${dep} is a large dependency. Consider alternatives.`);
    }
  });

  return warnings;
}

/**
 * Suggest tree-shaking opportunities
 */
export function suggestTreeShaking(imports: string[]): string[] {
  const suggestions: string[] = [];

  imports.forEach(imp => {
    if (imp.includes('import * as')) {
      suggestions.push(`Consider named imports instead of wildcard: ${imp}`);
    }

    if (imp.includes('from "lodash"')) {
      suggestions.push('Use lodash-es for better tree-shaking');
    }

    if (imp.includes('from "moment"')) {
      suggestions.push('Consider using dayjs or date-fns for smaller bundle');
    }
  });

  return suggestions;
}

/**
 * Generate bundle optimization report
 */
export function generateBundleReport(
  bundleAnalysis: BundleAnalysis,
  dependencyWarnings: string[],
  treeShakingSuggestions: string[]
): {
  summary: string;
  score: number;
  details: {
    size: string;
    gzipSize: string;
    moduleCount: number;
  };
  recommendations: string[];
} {
  const recommendations = [
    ...bundleAnalysis.recommendations,
    ...dependencyWarnings,
    ...treeShakingSuggestions,
  ];

  let score = 100;
  score -= bundleAnalysis.recommendations.length * 5;
  score -= dependencyWarnings.length * 3;
  score -= treeShakingSuggestions.length * 2;

  const sizeKB = (bundleAnalysis.size / 1024).toFixed(2);
  const gzipKB = (bundleAnalysis.gzipSize / 1024).toFixed(2);

  let summary = 'Bundle size is optimal';
  if (score < 70) summary = 'Bundle size needs optimization';
  else if (score < 85) summary = 'Bundle size could be improved';

  return {
    summary,
    score: Math.max(0, score),
    details: {
      size: `${sizeKB} KB`,
      gzipSize: `${gzipKB} KB`,
      moduleCount: bundleAnalysis.modules.length,
    },
    recommendations: [...new Set(recommendations)], // Remove duplicates
  };
}

/**
 * Check for unused exports
 */
export function checkUnusedExports(usedExports: string[], allExports: string[]): string[] {
  const unused = allExports.filter(exp => !usedExports.includes(exp));
  return unused;
}

/**
 * Suggest dynamic imports
 */
export function suggestDynamicImports(imports: string[]): string[] {
  const heavyLibraries = [
    'chart.js',
    'react-chartjs-2',
    'monaco-editor',
    'ace-builds',
    'pdfjs-dist',
    '@tensorflow/tfjs',
  ];

  const suggestions: string[] = [];

  imports.forEach(imp => {
    heavyLibraries.forEach(lib => {
      if (imp.includes(lib)) {
        suggestions.push(`Consider dynamic import for ${lib}: import('${lib}')`);
      }
    });
  });

  return suggestions;
}

/**
 * Calculate potential savings
 */
export function calculatePotentialSavings(currentSize: number, optimizations: Array<{
  type: string;
  savingsPercentage: number;
}>): {
  totalSavings: number;
  newSize: number;
  savingsPercentage: number;
  breakdown: Array<{
    type: string;
    savings: number;
  }>;
} {
  let totalSavingsPercentage = 0;

  optimizations.forEach(opt => {
    totalSavingsPercentage += opt.savingsPercentage;
  });

  // Cap at 90% to be realistic
  totalSavingsPercentage = Math.min(totalSavingsPercentage, 90);

  const totalSavings = Math.floor(currentSize * (totalSavingsPercentage / 100));
  const newSize = currentSize - totalSavings;

  const breakdown = optimizations.map(opt => ({
    type: opt.type,
    savings: Math.floor(currentSize * (opt.savingsPercentage / 100)),
  }));

  return {
    totalSavings,
    newSize,
    savingsPercentage: totalSavingsPercentage,
    breakdown,
  };
}

/**
 * Monitor bundle size over time
 */
export class BundleSizeMonitor {
  private history: Array<{
    timestamp: string;
    size: number;
    gzipSize: number;
  }> = [];

  record(size: number, gzipSize: number): void {
    this.history.push({
      timestamp: new Date().toISOString(),
      size,
      gzipSize,
    });

    // Keep only last 30 records
    if (this.history.length > 30) {
      this.history.shift();
    }
  }

  getTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.history.length < 3) return 'stable';

    const recent = this.history.slice(-5);
    const sizes = recent.map(h => h.size);

    const first = sizes[0];
    const last = sizes[sizes.length - 1];
    const change = ((last - first) / first) * 100;

    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  getAverageSize(): number {
    if (this.history.length === 0) return 0;
    const total = this.history.reduce((sum, h) => sum + h.size, 0);
    return Math.floor(total / this.history.length);
  }

  getHistory(): Array<{ timestamp: string; size: number; gzipSize: number }> {
    return [...this.history];
  }
}

// Create singleton instance
export const bundleSizeMonitor = new BundleSizeMonitor();

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if bundle exceeds budget
 */
export function checkBundleBudget(currentSize: number, budget: number): {
  withinBudget: boolean;
  overBudget: number;
  percentage: number;
} {
  const overBudget = Math.max(0, currentSize - budget);
  const percentage = (currentSize / budget) * 100;

  return {
    withinBudget: currentSize <= budget,
    overBudget,
    percentage,
  };
}
