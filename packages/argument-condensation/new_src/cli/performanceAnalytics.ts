import * as fs from 'fs/promises';
import * as path from 'path';
import { GlobalPerformanceMetrics } from '../evaluation/types/analytics/performanceMetrics';
import { PerformanceAnalyticsResult} from '../evaluation/types/analytics/analyticsResult';

/**
 * Analyzes the performance of a given condensation configuration based on golden dataset runs.
 */
export class PerformanceAnalytics {
  private baseResultsDir = path.join(__dirname, '..', 'evaluation', 'savedResults');
  private globalPerfPath = path.join(this.baseResultsDir, 'globalPerformance.json');

  async analyzePerformance(currentScore: number, testCaseScores: { testCaseId: string; score: number }[]): Promise<PerformanceAnalyticsResult> {
    // Load historical metrics
    let global: GlobalPerformanceMetrics;
    try {
      const content = await fs.readFile(this.globalPerfPath, 'utf-8');
      global = JSON.parse(content);
    } catch {
      // If no historical data exists, create default values
      global = {
        batchRunIds: [],
        totalBatchRuns: 0,
        historicalAverageScore: 0,
        bestScore: 0,
        bestBatchRun: null as any, // TypeScript workaround for first run
        last5Average: 0,
      };
    }

    return {
      currentScore,
      last5Average: global.last5Average,
      globalAverage: global.historicalAverageScore,
      bestScore: global.bestScore,
      testCaseScores
    };
  }

  displayAnalytics(result: PerformanceAnalyticsResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE ANALYTICS');
    console.log('='.repeat(60));
    
    // Overall score comparison
    console.log('\n🎯 OVERALL SCORE COMPARISON:');
    console.log(`   Current Score:     ${result.currentScore.toFixed(2)}`);
    console.log(`   Last 5 Average:    ${result.last5Average.toFixed(2)}`);
    console.log(`   Global Average:    ${result.globalAverage.toFixed(2)}`);
    console.log(`   Best Score:        ${result.bestScore.toFixed(2)}`);
    
    // Performance indicators
    const vsLast5 = result.currentScore - result.last5Average;
    const vsGlobal = result.currentScore - result.globalAverage;
    const vsBest = result.currentScore - result.bestScore;
    
    console.log('\n📈 PERFORMANCE INDICATORS:');
    console.log(`   vs Last 5:         ${vsLast5 >= 0 ? '+' : ''}${vsLast5.toFixed(2)}`);
    console.log(`   vs Global:         ${vsGlobal >= 0 ? '+' : ''}${vsGlobal.toFixed(2)}`);
    console.log(`   vs Best:           ${vsBest >= 0 ? '+' : ''}${vsBest.toFixed(2)}`);
    
    // Test case breakdown
    console.log('\n📋 TEST CASE SCORES:');
    result.testCaseScores.forEach((testCase, index) => {
      console.log(`   Test Case ${index + 1}: ${testCase.score.toFixed(2)}`);
    });
    
    console.log('\n' + '='.repeat(60));
  }
} 