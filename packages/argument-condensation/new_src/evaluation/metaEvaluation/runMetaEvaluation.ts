import { MetaEvaluationDataset, MetaEvaluationResult } from './types';
import { loadMetaEvaluationDataset } from './loadMetaEvalData';
import { BaseEvaluator } from '../evaluators/abstractEvaluator';
import { SingleEvaluationInput } from '../types/evaluationInput';

/**
 * Runs meta-evaluation to test which evaluator best correlates with human judgment.
 * 
 * @param evaluators - Array of evaluators to test
 * @returns Promise<MetaEvaluationResult[]> - Results for each evaluator tested
 */
export async function runMetaEvaluation(
  evaluators: BaseEvaluator[]
): Promise<MetaEvaluationResult[]> {
  
  // Load all meta-evaluation test data
  const datasets = await loadMetaEvaluationDataset();
  const results: MetaEvaluationResult[] = [];
  
  // Test each evaluator
  for (const evaluator of evaluators) {
    const allTestResults: Array<{
      topic: string;
      humanScore: number;
      scoreByEvaluator: number;
      difference: number;
      analysisOfDifference: string;
    }> = [];
    
    // Run evaluator on all test cases from all datasets
    for (const dataset of datasets) {
      for (const testCase of dataset.testCases) {
        
        // Convert MetaEvaluationCase to SingleEvaluationInput
        const evaluationInput: SingleEvaluationInput = {
          topic: testCase.topic,
          systemArguments: testCase.systemArguments,
          expectedArguments: testCase.goldenArguments
        };
        
        // Get evaluator's score
        const evaluatorResult = await evaluator.evaluateSingle(evaluationInput);
        
        // Calculate difference
        const difference = Math.abs(testCase.humanScore - evaluatorResult.score);
        
        // Store comparison data
        allTestResults.push({
          topic: testCase.topic,
          humanScore: testCase.humanScore,
          scoreByEvaluator: evaluatorResult.score,
          difference: difference,
          analysisOfDifference: `Human: ${testCase.humanScore}, Evaluator: ${evaluatorResult.score}, Diff: ${difference.toFixed(1)}`
        });
      }
    }
    
    // Calculate comprehensive metrics
    const metrics = calculateMetrics(allTestResults);
    
    results.push({
      methodName: evaluator.getName(),
      methodDescription: `Evaluation using ${evaluator.getName()}`,
      testResults: allTestResults,
      metrics: metrics
    });
  }
  
  return results;
}

/**
 * Calculate comprehensive metrics for meta-evaluation results.
 */
function calculateMetrics(testResults: Array<{
  topic: string;
  humanScore: number;
  scoreByEvaluator: number;
  difference: number;
  analysisOfDifference: string;
}>) {
  const humanScores = testResults.map(r => r.humanScore);
  const evaluatorScores = testResults.map(r => r.scoreByEvaluator);
  const differences = testResults.map(r => r.difference);
  
  // Calculate difference distribution
  const differenceDistribution: { [key: number]: number } = {};
  differences.forEach(diff => {
    const roundedDiff = Math.round(diff);
    differenceDistribution[roundedDiff] = (differenceDistribution[roundedDiff] || 0) + 1;
  });
  
  // Calculate correlation
  const correlation = calculateCorrelation(humanScores, evaluatorScores);
  
  return {
    differenceDistribution,
    averageDifference: differences.reduce((a, b) => a + b, 0) / differences.length,
    biggestDifference: Math.max(...differences),
    averageHumanScore: humanScores.reduce((a, b) => a + b, 0) / humanScores.length,
    averageEvaluatorScore: evaluatorScores.reduce((a, b) => a + b, 0) / evaluatorScores.length,
    correlationWithHuman: correlation
  };
}

/**
 * Calculate Pearson correlation coefficient between two arrays.
 */
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? -666 : numerator / denominator;
} 