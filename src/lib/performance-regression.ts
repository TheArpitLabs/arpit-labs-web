/**
 * Performance regression testing utilities
 * Provides performance benchmarking, regression detection, and performance trend analysis
 */

export interface PerformanceBenchmark {
  name: string;
  duration: number;
  memory: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceBaseline {
  name: string;
  averageDuration: number;
  averageMemory: number;
  samples: number;
  threshold: number;
}

export interface RegressionResult {
  passed: boolean;
  currentDuration: number;
  baselineDuration: number;
  difference: number;
  differencePercentage: number;
  memoryRegression?: boolean;
}

export interface PerformanceThresholds {
  duration: number; // Maximum acceptable duration (ms)
  memory: number; // Maximum acceptable memory (MB)
  regression: number; // Maximum acceptable regression percentage
}

/**
 * Performance regression tester class
 */
export class PerformanceRegressionTester {
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private history: Map<string, PerformanceBenchmark[]> = new Map();
  private thresholds: PerformanceThresholds = {
    duration: 5000, // 5 seconds
    memory: 100, // 100 MB
    regression: 20, // 20% regression
  };

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    if (thresholds) {
      this.thresholds = { ...this.thresholds, ...thresholds };
    }
  }

  /**
   * Set performance thresholds
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get performance thresholds
   */
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  /**
   * Benchmark a function
   */
  async benchmark<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<PerformanceBenchmark> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      await fn();
      const duration = performance.now() - startTime;
      const endMemory = this.getMemoryUsage();
      const memoryUsed = endMemory - startMemory;

      const benchmark: PerformanceBenchmark = {
        name,
        duration,
        memory: memoryUsed,
        timestamp: Date.now(),
        metadata,
      };

      this.addBenchmark(name, benchmark);
      return benchmark;
    } catch (error) {
      const duration = performance.now() - startTime;
      const endMemory = this.getMemoryUsage();
      const memoryUsed = endMemory - startMemory;

      const benchmark: PerformanceBenchmark = {
        name,
        duration,
        memory: memoryUsed,
        timestamp: Date.now(),
        metadata: { ...metadata, error: true },
      };

      this.addBenchmark(name, benchmark);
      throw error;
    }
  }

  /**
   * Benchmark a synchronous function
   */
  benchmarkSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): PerformanceBenchmark {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      fn();
      const duration = performance.now() - startTime;
      const endMemory = this.getMemoryUsage();
      const memoryUsed = endMemory - startMemory;

      const benchmark: PerformanceBenchmark = {
        name,
        duration,
        memory: memoryUsed,
        timestamp: Date.now(),
        metadata,
      };

      this.addBenchmark(name, benchmark);
      return benchmark;
    } catch (error) {
      const duration = performance.now() - startTime;
      const endMemory = this.getMemoryUsage();
      const memoryUsed = endMemory - startMemory;

      const benchmark: PerformanceBenchmark = {
        name,
        duration,
        memory: memoryUsed,
        timestamp: Date.now(),
        metadata: { ...metadata, error: true },
      };

      this.addBenchmark(name, benchmark);
      throw error;
    }
  }

  /**
   * Add benchmark to history
   */
  private addBenchmark(name: string, benchmark: PerformanceBenchmark): void {
    if (!this.history.has(name)) {
      this.history.set(name, []);
    }
    this.history.get(name)!.push(benchmark);

    // Keep only last 100 benchmarks
    const benchmarks = this.history.get(name)!;
    if (benchmarks.length > 100) {
      this.history.set(name, benchmarks.slice(-100));
    }
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    return 0;
  }

  /**
   * Establish baseline for a test
   */
  establishBaseline(name: string, samples: number = 10): PerformanceBaseline {
    const benchmarks = this.history.get(name) || [];
    const recentBenchmarks = benchmarks.slice(-samples);

    if (recentBenchmarks.length === 0) {
      throw new Error(`No benchmarks found for ${name}`);
    }

    const averageDuration =
      recentBenchmarks.reduce((sum, b) => sum + b.duration, 0) / recentBenchmarks.length;
    const averageMemory =
      recentBenchmarks.reduce((sum, b) => sum + b.memory, 0) / recentBenchmarks.length;

    const baseline: PerformanceBaseline = {
      name,
      averageDuration,
      averageMemory,
      samples: recentBenchmarks.length,
      threshold: this.thresholds.regression,
    };

    this.baselines.set(name, baseline);
    return baseline;
  }

  /**
   * Test for performance regression
   */
  testRegression(name: string): RegressionResult {
    const baseline = this.baselines.get(name);
    const benchmarks = this.history.get(name) || [];

    if (!baseline) {
      throw new Error(`No baseline found for ${name}`);
    }

    if (benchmarks.length === 0) {
      throw new Error(`No benchmarks found for ${name}`);
    }

    const latestBenchmark = benchmarks[benchmarks.length - 1];
    const currentDuration = latestBenchmark.duration;
    const baselineDuration = baseline.averageDuration;

    const difference = currentDuration - baselineDuration;
    const differencePercentage = (difference / baselineDuration) * 100;

    const durationRegression = differencePercentage > baseline.threshold;
    const memoryRegression =
      latestBenchmark.memory > baseline.averageMemory * (1 + baseline.threshold / 100);

    const passed = !durationRegression && !memoryRegression;

    return {
      passed,
      currentDuration,
      baselineDuration,
      difference,
      differencePercentage,
      memoryRegression,
    };
  }

  /**
   * Get benchmark history
   */
  getHistory(name: string): PerformanceBenchmark[] {
    return this.history.get(name) || [];
  }

  /**
   * Get baseline
   */
  getBaseline(name: string): PerformanceBaseline | undefined {
    return this.baselines.get(name);
  }

  /**
   * Get all baselines
   */
  getAllBaselines(): PerformanceBaseline[] {
    return Array.from(this.baselines.values());
  }

  /**
   * Clear history for a test
   */
  clearHistory(name: string): void {
    this.history.delete(name);
  }

  /**
   * Clear all history
   */
  clearAllHistory(): void {
    this.history.clear();
  }
}

export const performanceRegressionTester = new PerformanceRegressionTester();

/**
 * Performance trend analyzer
 */
export class PerformanceTrendAnalyzer {
  /**
   * Analyze performance trend over time
   */
  static analyzeTrend(benchmarks: PerformanceBenchmark[]): {
    trend: 'improving' | 'degrading' | 'stable';
    averageChange: number;
    confidence: number;
  } {
    if (benchmarks.length < 2) {
      return { trend: 'stable', averageChange: 0, confidence: 0 };
    }

    const recent = benchmarks.slice(-10);
    const older = benchmarks.slice(-20, -10);

    if (older.length === 0) {
      return { trend: 'stable', averageChange: 0, confidence: 0 };
    }

    const recentAvg = recent.reduce((sum, b) => sum + b.duration, 0) / recent.length;
    const olderAvg = older.reduce((sum, b) => sum + b.duration, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    let trend: 'improving' | 'degrading' | 'stable';
    if (change < -5) {
      trend = 'improving';
    } else if (change > 5) {
      trend = 'degrading';
    } else {
      trend = 'stable';
    }

    const confidence = Math.min(100, (benchmarks.length / 20) * 100);

    return {
      trend,
      averageChange: change,
      confidence,
    };
  }

  /**
   * Detect anomalies in performance data
   */
  static detectAnomalies(benchmarks: PerformanceBenchmark[]): PerformanceBenchmark[] {
    if (benchmarks.length < 5) {
      return [];
    }

    const durations = benchmarks.map(b => b.duration);
    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);

    const threshold = mean + 2 * stdDev; // 2 standard deviations

    return benchmarks.filter(b => b.duration > threshold);
  }

  /**
   * Calculate performance percentile
   */
  static calculatePercentile(benchmarks: PerformanceBenchmark[], percentile: number): number {
    if (benchmarks.length === 0) return 0;

    const durations = benchmarks.map(b => b.duration).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * durations.length) - 1;

    return durations[Math.max(0, index)];
  }
}

/**
 * Performance regression CI/CD integration
 */
export class PerformanceRegressionCI {
  /**
   * Generate CI report
   */
  static generateReport(results: Array<{
    name: string;
    result: RegressionResult;
  }>): string {
    const passed = results.filter(r => r.result.passed).length;
    const failed = results.filter(r => !r.result.passed).length;
    const total = results.length;

    return `
# Performance Regression Test Report

## Summary
- Total Tests: ${total}
- Passed: ${passed}
- Failed: ${failed}
- Success Rate: ${((passed / total) * 100).toFixed(2)}%

## Failed Tests
${results
  .filter(r => !r.result.passed)
  .map(r => `- ${r.name}: ${r.result.differencePercentage.toFixed(2)}% regression`)
  .join('\n')}

## Performance Details
${results
  .map(r => `
### ${r.name}
- Current: ${r.result.currentDuration.toFixed(2)}ms
- Baseline: ${r.result.baselineDuration.toFixed(2)}ms
- Difference: ${r.result.difference.toFixed(2)}ms (${r.result.differencePercentage.toFixed(2)}%)
- Status: ${r.result.passed ? '✅ PASSED' : '❌ FAILED'}
`)
  .join('\n')}
`;
  }

  /**
   * Generate GitHub Actions config
   */
  static generateGitHubActionsConfig(): string {
    return `
name: Performance Regression Tests

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *' # Daily

jobs:
  performance-regression:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run performance tests
        run: npm run test:performance
        
      - name: Upload performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: performance-results/
          
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('performance-report.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
`;
  }

  /**
   * Check if performance regression should block merge
   */
  static shouldBlockMerge(results: Array<{ name: string; result: RegressionResult }>): boolean {
    const criticalRegressions = results.filter(
      r => !r.result.passed && r.result.differencePercentage > 50
    );

    return criticalRegressions.length > 0;
  }
}

/**
 * Performance regression monitoring
 */
export class PerformanceRegressionMonitor {
  private alerts: Array<{
    name: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: number;
  }> = [];

  /**
   * Monitor performance and generate alerts
   */
  monitor(results: Array<{ name: string; result: RegressionResult }>): void {
    for (const { name, result } of results) {
      if (!result.passed) {
        const severity = this.calculateSeverity(result);
        const message = this.generateAlertMessage(name, result);

        this.alerts.push({
          name,
          severity,
          message,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Calculate alert severity
   */
  private calculateSeverity(result: RegressionResult): 'low' | 'medium' | 'high' {
    if (result.differencePercentage > 50) return 'high';
    if (result.differencePercentage > 20) return 'medium';
    return 'low';
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(name: string, result: RegressionResult): string {
    return `Performance regression detected in ${name}: ${result.differencePercentage.toFixed(2)}% increase`;
  }

  /**
   * Get alerts
   */
  getAlerts(): Array<{
    name: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: number;
  }> {
    return [...this.alerts];
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: 'low' | 'medium' | 'high'): Array<{
    name: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: number;
  }> {
    return this.alerts.filter(a => a.severity === severity);
  }
}

export const performanceRegressionMonitor = new PerformanceRegressionMonitor();

/**
 * Performance regression utilities
 */
export const performanceRegressionUtils = {
  /**
   * Quick benchmark
   */
  quickBenchmark: async <T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<PerformanceBenchmark> => {
    return performanceRegressionTester.benchmark(name, fn);
  },

  /**
   * Quick regression test
   */
  quickTest: (name: string): RegressionResult => {
    return performanceRegressionTester.testRegression(name);
  },

  /**
   * Establish all baselines
   */
  establishBaselines: (names: string[]): void => {
    for (const name of names) {
      performanceRegressionTester.establishBaseline(name);
    }
  },

  /**
   * Get performance summary
   */
  getSummary: (results: Array<{ name: string; result: RegressionResult }>): string => {
    const passed = results.filter(r => r.result.passed).length;
    const total = results.length;
    const percentage = ((passed / total) * 100).toFixed(2);

    return `Performance Regression: ${passed}/${total} passed (${percentage}%)`;
  },
};
