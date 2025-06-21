import * as fs from 'fs/promises';
import * as path from 'path';
import { QuestionPerformanceMetrics, GoldenDatasetBatchRun, GlobalPerformanceMetrics } from './types/analytics/performanceMetrics';
import { FullCondensationRunRecord } from './types/analytics/runRecord';

export class PerformanceTracker {
  private baseResultsDir = path.join(__dirname, 'savedResults');
  private globalPerfPath = path.join(this.baseResultsDir, 'globalPerformance.json');

  // Update per-question metrics after a run
  async updateQuestionMetrics(electionId: string, condensationType: string, questionId: string, run: FullCondensationRunRecord) {
    const questionHistoryPath = path.join(this.baseResultsDir, 'singleRuns', electionId, condensationType, questionId, 'aggregatedRunHistory.json');
    let metrics: QuestionPerformanceMetrics;
    try {
      const content = await fs.readFile(questionHistoryPath, 'utf-8');
      metrics = JSON.parse(content);
    } catch {
      metrics = {
        questionId,
        totalRuns: 0,
        historyOfRuns: [],
        historicalAverage: 0,
        bestScore: 0,
        bestRun: null as any, // TypeScript workaround for first run
        last5Average: 0,
      };
    }
    // Add new run
    metrics.historyOfRuns.push({
      runId: run.runId,
      plan: {
        outputType: run.outputType,
        steps: run.plan.steps,
        nOutputArgs: run.plan.nOutputArgs,
        language: run.plan.language
      },
      score: run.evaluation.score,
      timestamp: run.timestamp,
    });
    metrics.totalRuns = metrics.historyOfRuns.length;
    // Update averages and bests
    const scores = metrics.historyOfRuns.map(r => r.score);
    metrics.historicalAverage = scores.reduce((a, b) => a + b, 0) / scores.length;
    metrics.bestScore = Math.max(...scores);
    metrics.bestRun = metrics.historyOfRuns.reduce((best, curr) => (!best || curr.score > best.score) ? curr : best, null as any);
    metrics.last5Average = scores.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, scores.length);

    await fs.mkdir(path.dirname(questionHistoryPath), { recursive: true });
    await fs.writeFile(questionHistoryPath, JSON.stringify(metrics, null, 2));
  }

  // Save a batch run and update global metrics (call after all questions in batch are done)
  async saveBatchRunAndUpdateGlobal(batchRun: GoldenDatasetBatchRun) {
    const batchPath = path.join(this.baseResultsDir, 'batchedGoldenEvals', `${batchRun.batchRunId}.json`);
    await fs.mkdir(path.dirname(batchPath), { recursive: true });
    await fs.writeFile(batchPath, JSON.stringify(batchRun, null, 2));

    // Update global performance
    let global: GlobalPerformanceMetrics;
    try {
      const content = await fs.readFile(this.globalPerfPath, 'utf-8');
      global = JSON.parse(content);
    } catch {
      global = {
        batchRunIds: [],
        totalBatchRuns: 0,
        historicalAverageScore: 0,
        bestScore: 0,
        bestBatchRun: null as any,
        last5Average: 0,
      };
    }
    global.batchRunIds.push(batchRun.batchRunId);
    global.totalBatchRuns = global.batchRunIds.length;

    // Load all batch runs for metrics
    const batchRuns: GoldenDatasetBatchRun[] = [];
    for (const id of global.batchRunIds) {
      try {
        const filePath = path.join(this.baseResultsDir, 'batchedGoldenEvals', `${id}.json`);
        const content = await fs.readFile(filePath, 'utf-8');
        batchRuns.push(JSON.parse(content));
      } catch {}
    }
    const averages = batchRuns.map(b => b.averageScore);
    global.historicalAverageScore = averages.length ? averages.reduce((a, b) => a + b, 0) / averages.length : 0;
    global.bestScore = averages.length ? Math.max(...averages) : 0;
    global.bestBatchRun = batchRuns.reduce((best, curr) => (!best || curr.averageScore > best.averageScore) ? curr : best, null as any);
    global.last5Average = averages.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, averages.length);

    await fs.writeFile(this.globalPerfPath, JSON.stringify(global, null, 2));
  }
}