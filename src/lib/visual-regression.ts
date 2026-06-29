/**
 * Visual regression testing utilities
 * Provides screenshot comparison, visual diff generation, and regression detection
 */

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  deviceScaleFactor?: number;
  fullPage?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ComparisonResult {
  passed: boolean;
  diffPixels: number;
  diffPercentage: number;
  diffImage?: string;
  baselineImage?: string;
  currentImage?: string;
}

export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
}

export const VIEWPORTS: ViewportConfig[] = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'tablet', width: 768, height: 1024, isMobile: true },
  { name: 'mobile', width: 375, height: 667, isMobile: true, deviceScaleFactor: 2 },
];

/**
 * Visual regression tester class
 */
export class VisualRegressionTester {
  private baselineDir: string;
  private currentDir: string;
  private diffDir: string;
  private threshold: number;

  constructor(options: {
    baselineDir?: string;
    currentDir?: string;
    diffDir?: string;
    threshold?: number;
  } = {}) {
    this.baselineDir = options.baselineDir || './screenshots/baseline';
    this.currentDir = options.currentDir || './screenshots/current';
    this.diffDir = options.diffDir || './screenshots/diff';
    this.threshold = options.threshold || 0.1; // 10% difference threshold
  }

  /**
   * Capture screenshot of a page or element
   */
  async captureScreenshot(
    url: string,
    name: string,
    options: ScreenshotOptions = {}
  ): Promise<string> {
    // In a real implementation, this would use Playwright or Puppeteer
    // For now, this is a placeholder
    const screenshotPath = `${this.currentDir}/${name}.png`;
    
    // Simulate screenshot capture
    console.log(`Capturing screenshot for ${url} as ${name}`);
    
    return screenshotPath;
  }

  /**
   * Compare two screenshots
   */
  async compareScreenshots(
    baselinePath: string,
    currentPath: string
  ): Promise<ComparisonResult> {
    // In a real implementation, this would use pixelmatch or similar
    // For now, this is a placeholder
    
    console.log(`Comparing ${baselinePath} with ${currentPath}`);
    
    return {
      passed: true,
      diffPixels: 0,
      diffPercentage: 0,
      baselineImage: baselinePath,
      currentImage: currentPath,
    };
  }

  /**
   * Run visual regression test for a URL
   */
  async testURL(
    url: string,
    name: string,
    viewports: ViewportConfig[] = VIEWPORTS
  ): Promise<{ viewport: string; result: ComparisonResult }[]> {
    const results: { viewport: string; result: ComparisonResult }[] = [];

    for (const viewport of viewports) {
      const viewportName = `${name}-${viewport.name}`;
      
      // Capture current screenshot
      const currentPath = await this.captureScreenshot(url, viewportName, {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: viewport.deviceScaleFactor,
      });

      // Compare with baseline
      const baselinePath = `${this.baselineDir}/${viewportName}.png`;
      const result = await this.compareScreenshots(baselinePath, currentPath);

      results.push({
        viewport: viewport.name,
        result,
      });
    }

    return results;
  }

  /**
   * Update baseline with current screenshots
   */
  async updateBaseline(name: string): Promise<void> {
    console.log(`Updating baseline for ${name}`);
    // In a real implementation, this would copy current screenshots to baseline
  }

  /**
   * Set custom threshold
   */
  setThreshold(threshold: number): void {
    this.threshold = threshold;
  }

  /**
   * Get threshold
   */
  getThreshold(): number {
    return this.threshold;
  }
}

export const visualRegressionTester = new VisualRegressionTester();

/**
 * Screenshot comparison utilities
 */
export class ScreenshotComparator {
  /**
   * Calculate pixel difference between two images
   */
  static async calculatePixelDiff(
    image1: string,
    image2: string
  ): Promise<{ diffPixels: number; totalPixels: number; percentage: number }> {
    // In a real implementation, this would use canvas or image processing library
    // For now, this is a placeholder
    
    return {
      diffPixels: 0,
      totalPixels: 1000000,
      percentage: 0,
    };
  }

  /**
   * Generate diff image
   */
  static async generateDiffImage(
    image1: string,
    image2: string,
    outputPath: string
  ): Promise<void> {
    // In a real implementation, this would highlight differences
    console.log(`Generating diff image at ${outputPath}`);
  }

  /**
   * Check if images are identical
   */
  static async areImagesIdentical(image1: string, image2: string): Promise<boolean> {
    const diff = await this.calculatePixelDiff(image1, image2);
    return diff.percentage === 0;
  }
}

/**
 * Visual regression test runner
 */
export class VisualRegressionTestRunner {
  private tests: Array<{
    name: string;
    url: string;
    viewports?: ViewportConfig[];
  }> = [];

  /**
   * Add test case
   */
  addTest(name: string, url: string, viewports?: ViewportConfig[]): void {
    this.tests.push({ name, url, viewports });
  }

  /**
   * Run all tests
   */
  async runAll(): Promise<{
    passed: number;
    failed: number;
    results: Array<{
      name: string;
      url: string;
      viewport: string;
      result: ComparisonResult;
    }>;
  }> {
    const results: Array<{
      name: string;
      url: string;
      viewport: string;
      result: ComparisonResult;
    }> = [];

    let passed = 0;
    let failed = 0;

    for (const test of this.tests) {
      const testResults = await visualRegressionTester.testURL(
        test.url,
        test.name,
        test.viewports
      );

      for (const { viewport, result } of testResults) {
        results.push({
          name: test.name,
          url: test.url,
          viewport,
          result,
        });

        if (result.passed) {
          passed++;
        } else {
          failed++;
        }
      }
    }

    return { passed, failed, results };
  }

  /**
   * Clear all tests
   */
  clearTests(): void {
    this.tests = [];
  }
}

export const visualRegressionTestRunner = new VisualRegressionTestRunner();

/**
 * Component screenshot utilities
 */
export class ComponentScreenshotter {
  /**
   * Capture component screenshot
   */
  static async captureComponent(
    componentName: string,
    props: Record<string, any> = {},
    options: ScreenshotOptions = {}
  ): Promise<string> {
    // In a real implementation, this would render the component and capture it
    console.log(`Capturing component ${componentName} with props:`, props);
    
    return `./screenshots/components/${componentName}.png`;
  }

  /**
   * Capture component in multiple states
   */
  static async captureComponentStates(
    componentName: string,
    states: Array<{ name: string; props: Record<string, any> }>
  ): Promise<string[]> {
    const screenshots: string[] = [];

    for (const state of states) {
      const path = await this.captureComponent(
        `${componentName}-${state.name}`,
        state.props
      );
      screenshots.push(path);
    }

    return screenshots;
  }
}

/**
 * Visual regression CI/CD integration
 */
export class VisualRegressionCI {
  /**
   * Setup for CI environment
   */
  static setupCI(): void {
    console.log('Setting up visual regression for CI');
    // Configure for CI environment
  }

  /**
   * Generate CI report
   */
  static generateReport(results: {
    passed: number;
    failed: number;
    results: Array<{
      name: string;
      url: string;
      viewport: string;
      result: ComparisonResult;
    }>;
  }): string {
    const total = results.passed + results.failed;
    const percentage = ((results.passed / total) * 100).toFixed(2);

    return `
# Visual Regression Test Report

## Summary
- Total Tests: ${total}
- Passed: ${results.passed}
- Failed: ${results.failed}
- Success Rate: ${percentage}%

## Failed Tests
${results.results
  .filter(r => !r.result.passed)
  .map(r => `- ${r.name} (${r.viewport}): ${r.result.diffPercentage.toFixed(2)}% diff`)
  .join('\n')}
`;
  }

  /**
   * Upload artifacts
   */
  static async uploadArtifacts(results: any): Promise<void> {
    console.log('Uploading visual regression artifacts');
    // Upload screenshots and diffs to CI artifact storage
  }
}

/**
 * Visual regression GitHub Actions integration
 */
export function generateGitHubActionsConfig(): string {
  return `
name: Visual Regression Tests

on:
  pull_request:
    branches: [main]

jobs:
  visual-regression:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Run visual regression tests
        run: npm run test:visual
        
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: screenshots
          path: screenshots/
`;
}

/**
 * Visual regression monitoring
 */
export class VisualRegressionMonitor {
  private history: Map<string, number[]> = new Map();

  /**
   * Track diff percentage over time
   */
  trackDiff(testName: string, diffPercentage: number): void {
    if (!this.history.has(testName)) {
      this.history.set(testName, []);
    }
    this.history.get(testName)!.push(diffPercentage);
  }

  /**
   * Get trend for a test
   */
  getTrend(testName: string): { average: number; trend: 'improving' | 'worsening' | 'stable' } {
    const values = this.history.get(testName) || [];
    if (values.length < 2) {
      return { average: 0, trend: 'stable' };
    }

    const recent = values.slice(-5);
    const older = values.slice(-10, -5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const trend = recentAvg < olderAvg ? 'improving' : recentAvg > olderAvg ? 'worsening' : 'stable';

    return { average: recentAvg, trend };
  }

  /**
   * Get all trends
   */
  getAllTrends(): Record<string, { average: number; trend: string }> {
    const trends: Record<string, { average: number; trend: string }> = {};

    this.history.forEach((_, testName) => {
      trends[testName] = this.getTrend(testName);
    });

    return trends;
  }
}

export const visualRegressionMonitor = new VisualRegressionMonitor();

/**
 * Visual regression utilities for development
 */
export const visualRegressionUtils = {
  /**
   * Quick screenshot capture
   */
  quickCapture: async (url: string): Promise<string> => {
    return visualRegressionTester.captureScreenshot(url, 'quick-capture');
  },

  /**
   * Quick comparison
   */
  quickCompare: async (image1: string, image2: string): Promise<ComparisonResult> => {
    return visualRegressionTester.compareScreenshots(image1, image2);
  },

  /**
   * Update all baselines
   */
  updateBaselines: async (names: string[]): Promise<void> => {
    for (const name of names) {
      await visualRegressionTester.updateBaseline(name);
    }
  },

  /**
   * Get test summary
   */
  getSummary: (results: { passed: number; failed: number }): string => {
    const total = results.passed + results.failed;
    const percentage = ((results.passed / total) * 100).toFixed(2);
    
    return `Visual Regression: ${results.passed}/${total} passed (${percentage}%)`;
  },
};
