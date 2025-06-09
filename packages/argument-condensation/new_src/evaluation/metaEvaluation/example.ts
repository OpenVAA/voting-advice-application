import { runMetaEvaluation } from './runMetaEvaluation';
import { StubEvaluator } from '../evaluators/stubEvaluator';

/**
 * Example demonstrating how to run meta-evaluation with different evaluators.
 * This tests which evaluation method best correlates with human judgment.
 */
async function exampleMetaEvaluation() {
  console.log('Running meta-evaluation example...\n');
  
  // Create different stub evaluators to test
  const evaluators = [
    new StubEvaluator(7, "Optimistic evaluator - tends to score high"),
    new StubEvaluator(5, "Neutral evaluator - gives middle scores"),
    new StubEvaluator(3, "Pessimistic evaluator - tends to score low"),
    new StubEvaluator(8, "Very optimistic evaluator - scores very high")
  ];
  
  try {
    // Run meta-evaluation
    const results = await runMetaEvaluation(evaluators);
    
    // Display results
    console.log('Meta-Evaluation Results:');
    console.log('========================\n');
    
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.methodName}`);
      console.log(`   Description: ${result.methodDescription}`);
      console.log(`   Correlation with Human: ${result.metrics.correlationWithHuman.toFixed(3)}`);
      console.log(`   Average Difference: ${result.metrics.averageDifference.toFixed(2)}`);
      console.log(`   Biggest Difference: ${result.metrics.biggestDifference.toFixed(2)}`);
      console.log(`   Average Human Score: ${result.metrics.averageHumanScore.toFixed(2)}`);
      console.log(`   Average Evaluator Score: ${result.metrics.averageEvaluatorScore.toFixed(2)}`);
      console.log(`   Test Cases: ${result.testResults.length}`);
      console.log('');
    });
    
    // Find best correlating evaluator
    const bestEvaluator = results.reduce((best, current) => 
      current.metrics.correlationWithHuman > best.metrics.correlationWithHuman ? current : best
    );
    
    console.log(`Best Evaluator: ${bestEvaluator.methodName}`);
    console.log(`Correlation: ${bestEvaluator.metrics.correlationWithHuman.toFixed(3)}`);
    
  } catch (error) {
    console.error('Error running meta-evaluation:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  exampleMetaEvaluation();
} 