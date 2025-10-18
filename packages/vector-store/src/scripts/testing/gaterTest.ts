import { LLMProvider } from '@openvaa/llm-refactor';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import path from 'path';
import { isRAGRequired } from '../../core/utils/isRAGRequired';

dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '..','.env') });
const apiKey = process.env.OPENAI_API_KEY;

// ----------------------------------------
// TYPES
// ----------------------------------------

interface TestCase {
  id: string;
  expectedRAG: boolean;
  category: string;
  contextLength: number;
  contextMessages: Array<string>;
  query: string;
  description: string;
}

interface TestDataset {
  testCases: Array<TestCase>;
}

interface TestResult {
  testCaseId: string;
  expectedRAG: boolean;
  predictedRAG: boolean;
  category: string;
  contextLength: number;
  correct: boolean;
}

interface ConfusionMatrix {
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
}

interface Metrics extends ConfusionMatrix {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  total: number;
}

interface CategoryMetrics {
  [category: string]: Metrics;
}

interface ContextLengthMetrics {
  [contextLength: number]: Metrics;
}

interface TestReport {
  overall: Metrics;
  byCategory: CategoryMetrics;
  byContextLength: ContextLengthMetrics;
  misclassifications: Array<TestResult & { query: string; description: string }>;
  timestamp: string;
}

// ----------------------------------------
// HELPERS
// ----------------------------------------

function calculateMetrics(results: Array<TestResult>): Metrics {
  const confusionMatrix: ConfusionMatrix = {
    truePositive: 0,
    trueNegative: 0,
    falsePositive: 0,
    falseNegative: 0
  };

  for (const result of results) {
    if (result.expectedRAG && result.predictedRAG) {
      confusionMatrix.truePositive++;
    } else if (!result.expectedRAG && !result.predictedRAG) {
      confusionMatrix.trueNegative++;
    } else if (!result.expectedRAG && result.predictedRAG) {
      confusionMatrix.falsePositive++;
    } else if (result.expectedRAG && !result.predictedRAG) {
      confusionMatrix.falseNegative++;
    }
  }

  const total = results.length;
  const accuracy = (confusionMatrix.truePositive + confusionMatrix.trueNegative) / total;
  const precision = confusionMatrix.truePositive / (confusionMatrix.truePositive + confusionMatrix.falsePositive || 1);
  const recall = confusionMatrix.truePositive / (confusionMatrix.truePositive + confusionMatrix.falseNegative || 1);
  const f1Score = (2 * precision * recall) / (precision + recall || 1);

  return {
    ...confusionMatrix,
    accuracy,
    precision,
    recall,
    f1Score,
    total
  };
}

function groupBy<TItem>(
  items: Array<TItem>,
  keyFn: (item: TItem) => string | number
): Map<string | number, Array<TItem>> {
  const map = new Map<string | number, Array<TItem>>();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(item);
  }
  return map;
}

function printMetrics(label: string, metrics: Metrics): void {
  console.info(`\n${label}:`);
  console.info(`  Total: ${metrics.total}`);
  console.info(`  True Positive: ${metrics.truePositive}`);
  console.info(`  True Negative: ${metrics.trueNegative}`);
  console.info(`  False Positive: ${metrics.falsePositive}`);
  console.info(`  False Negative: ${metrics.falseNegative}`);
  console.info(`  Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
  console.info(`  Precision: ${(metrics.precision * 100).toFixed(2)}%`);
  console.info(`  Recall: ${(metrics.recall * 100).toFixed(2)}%`);
  console.info(`  F1 Score: ${(metrics.f1Score * 100).toFixed(2)}%`);
}

// ----------------------------------------
// MAIN TEST FUNCTION
// ----------------------------------------

async function runGaterTest(): Promise<void> {
  console.info('='.repeat(60));
  console.info('RAG GATER EVALUATION TEST');
  console.info('='.repeat(60));

  // Load test dataset
  const datasetPath = join(__dirname, 'gaterTestDataset.json');
  const datasetContent = readFileSync(datasetPath, 'utf-8');
  const dataset: TestDataset = JSON.parse(datasetContent);

  console.info(`\nLoaded ${dataset.testCases.length} test cases`);

  // Initialize LLM provider for gater
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const gater = new LLMProvider({
    provider: 'openai',
    apiKey,
    modelConfig: { primary: 'gpt-5-nano' }
  });

  console.info('\nRunning tests...\n');

  // Run tests in parallel batches of 8
  const results: Array<TestResult> = [];
  let processed = 0;
  const batchSize = 8;

  for (let i = 0; i < dataset.testCases.length; i += batchSize) {
    const batch = dataset.testCases.slice(i, i + batchSize);

    // Process batch in parallel
    const batchPromises = batch.map(async (testCase) => {
      // Construct message array (context + query)
      const messages = [...testCase.contextMessages, testCase.query];

      // Run isRAGRequired
      const predictedRAG = await isRAGRequired({
        messages,
        provider: gater,
        modelConfig: { primary: 'gpt-5-nano' }
      });

      const result: TestResult = {
        testCaseId: testCase.id,
        expectedRAG: testCase.expectedRAG,
        predictedRAG,
        category: testCase.category,
        contextLength: testCase.contextLength,
        correct: predictedRAG === testCase.expectedRAG
      };

      return result;
    });

    // Wait for all promises in the batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    processed += batchResults.length;

    // Progress indicator
    console.info(`Processed ${processed}/${dataset.testCases.length} test cases...`);
  }

  console.info(`\nCompleted ${processed}/${dataset.testCases.length} test cases\n`);

  // Calculate overall metrics
  const overallMetrics = calculateMetrics(results);

  // Calculate metrics by category
  const resultsByCategory = groupBy(results, (r) => r.category);
  const categoryMetrics: CategoryMetrics = {};
  for (const [category, categoryResults] of resultsByCategory) {
    categoryMetrics[category] = calculateMetrics(categoryResults);
  }

  // Calculate metrics by context length
  const resultsByContextLength = groupBy(results, (r) => r.contextLength);
  const contextLengthMetrics: ContextLengthMetrics = {};
  for (const [contextLength, contextResults] of resultsByContextLength) {
    contextLengthMetrics[contextLength as number] = calculateMetrics(contextResults);
  }

  // Collect misclassifications
  const misclassifications = results
    .filter((r) => !r.correct)
    .map((r) => {
      const testCase = dataset.testCases.find((tc) => tc.id === r.testCaseId)!;
      return {
        ...r,
        query: testCase.query,
        description: testCase.description
      };
    });

  // Print results
  console.info('='.repeat(60));
  console.info('OVERALL RESULTS');
  console.info('='.repeat(60));
  printMetrics('Overall Performance', overallMetrics);

  console.info('\n' + '='.repeat(60));
  console.info('RESULTS BY CATEGORY');
  console.info('='.repeat(60));
  for (const [category, metrics] of Object.entries(categoryMetrics)) {
    printMetrics(category, metrics);
  }

  console.info('\n' + '='.repeat(60));
  console.info('RESULTS BY CONTEXT LENGTH');
  console.info('='.repeat(60));
  for (const [contextLength, metrics] of Object.entries(contextLengthMetrics).sort(
    ([a], [b]) => Number(a) - Number(b)
  )) {
    printMetrics(`Context Length: ${contextLength}`, metrics);
  }

  console.info('\n' + '='.repeat(60));
  console.info('MISCLASSIFICATIONS');
  console.info('='.repeat(60));
  console.info(`\nTotal misclassifications: ${misclassifications.length}\n`);

  if (misclassifications.length > 0) {
    for (const mis of misclassifications) {
      console.info(`ID: ${mis.testCaseId}`);
      console.info(`  Category: ${mis.category}`);
      console.info(`  Context Length: ${mis.contextLength}`);
      console.info(`  Expected: ${mis.expectedRAG ? 'RAG=true' : 'RAG=false'}`);
      console.info(`  Predicted: ${mis.predictedRAG ? 'RAG=true' : 'RAG=false'}`);
      console.info(`  Query: "${mis.query}"`);
      console.info(`  Description: ${mis.description}`);
      console.info('');
    }
  }

  // Save report to JSON
  const report: TestReport = {
    overall: overallMetrics,
    byCategory: categoryMetrics,
    byContextLength: contextLengthMetrics,
    misclassifications,
    timestamp: new Date().toISOString()
  };

  const reportPath = join(__dirname, 'gaterTestReport.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.info(`\nReport saved to: ${reportPath}`);

  console.info('\n' + '='.repeat(60));
  console.info('TEST COMPLETE');
  console.info('='.repeat(60));
}

// ----------------------------------------
// RUN
// ----------------------------------------

runGaterTest().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
