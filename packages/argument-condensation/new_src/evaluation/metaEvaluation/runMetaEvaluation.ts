import { MetaEvaluationResult } from './types';
import { loadEvaluators } from './utils/loadEvaluators';
import { loadTestCases } from './utils/loadTestData';
import { SingleEvaluationInput } from '../types/evaluationInput';

/**
 * Runs meta-evaluation to test which evaluator best correlates with human judgment.
 * Automatically discovers available evaluators and loads test cases for the specified language.
 * 
 * @param language - Language code for test cases (e.g., 'fi', 'en')
 * @returns Promise<MetaEvaluationResult[]> - Results for each evaluator tested
 */
export async function runMetaEvaluation(
  language: string = 'fi'
): Promise<MetaEvaluationResult[]> {
  
  console.log(`Starting meta-evaluation for language: ${language}`);
  
  // Load all available evaluators (excluding stub and abstract evaluators)
  const evaluators = await loadEvaluators();
  console.log(`Loaded ${evaluators.length} evaluators: ${evaluators.map(e => e.getName()).join(', ')}`);
  
  if (evaluators.length === 0) {
    throw new Error('No evaluators found. Make sure evaluator implementations are available and properly configured.');
  }
  
  // Load test cases for the specified language
  const testCases = await loadTestCases(language);
  console.log(`Loaded ${testCases.length} test cases for language: ${language}`);
  
  if (testCases.length === 0) {
    throw new Error(`No test cases found for language: ${language}. Make sure test data exists in the specified directories.`);
  }
  
  const results: MetaEvaluationResult[] = [];
  
  // Test each evaluator
  for (const evaluator of evaluators) {
    console.log(`\nEvaluating with: ${evaluator.getName()}`);
    
    const allTestResults: Array<{
      topic: string;
      humanScore: number;
      scoreByEvaluator: number;
      difference: number;
      analysisOfDifference: string;
    }> = [];
    
    // Run evaluator on all test cases
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`  Processing test case ${i + 1}/${testCases.length}: ${testCase.topic.substring(0, 50)}...`);
      
      try {
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
          analysisOfDifference: `Human: ${testCase.humanScore}, Evaluator: ${evaluatorResult.score.toFixed(1)}, Diff: ${difference.toFixed(1)}`
        });
        
        console.log(`    Human: ${testCase.humanScore}, Evaluator: ${evaluatorResult.score.toFixed(1)}, Diff: ${difference.toFixed(1)}`);
      } catch (error) {
        console.error(`    Error evaluating test case: ${error}`);
        // Continue with other test cases even if one fails
      }
    }
    
    // Calculate comprehensive metrics
    const metrics = calculateMetrics(allTestResults);
    
    const result: MetaEvaluationResult = {
      methodName: evaluator.getName(),
      methodDescription: `Evaluation using ${evaluator.getName()}`,
      testResults: allTestResults,
      metrics: metrics
    };
    
    results.push(result);
    
    // Log summary for this evaluator
    console.log(`  Summary for ${evaluator.getName()}:`);
    console.log(`    Correlation with human: ${metrics.correlationWithHuman.toFixed(3)}`);
    console.log(`    Average difference: ${metrics.averageDifference.toFixed(2)}`);
    console.log(`    Biggest difference: ${metrics.biggestDifference.toFixed(2)}`);
  }
  
  // Log overall summary
  console.log('\n=== META-EVALUATION SUMMARY ===');
  results.forEach(result => {
    console.log(`${result.methodName}:`);
    console.log(`  Correlation: ${result.metrics.correlationWithHuman.toFixed(3)}`);
    console.log(`  Avg Difference: ${result.metrics.averageDifference.toFixed(2)}`);
    console.log(`  Test Cases: ${result.testResults.length}`);
  });
  
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
  if (testResults.length === 0) {
    return {
      differenceDistribution: {},
      averageDifference: 0,
      biggestDifference: 0,
      averageHumanScore: 0,
      averageEvaluatorScore: 0,
      correlationWithHuman: 0
    };
  }
  
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
  
  return denominator === 0 ? 0 : numerator / denominator;
} 