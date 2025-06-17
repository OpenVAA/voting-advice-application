import { runAllTypesPerformanceEval } from './systemPerformanceEval';
import { StubEvaluator } from './evaluators/stubEvaluator';
import { CondensationSessionConfig } from '../core/types/condensationInput';
import { CondensationOutputType } from '../core/types/condensationType';

// Example configs for each condensation type
const prosConfig: CondensationSessionConfig = {
  batchSize: 10,
  nOutputArgs: 8,
  language: 'en',
  condensationType: 'likertPros'
};

const consConfig: CondensationSessionConfig = {
  batchSize: 10,
  nOutputArgs: 8,
  language: 'en',
  condensationType: 'likertCons'
};

const configs: Record<CondensationOutputType, CondensationSessionConfig> = {
  likertPros: prosConfig,
  likertCons: consConfig,
};

async function main() {
  // Use the stub evaluator for demonstration
  const evaluator = new StubEvaluator(7, "Stub evaluation");

  // Run the performance evaluation for all types
  await runAllTypesPerformanceEval(configs, evaluator);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Performance evaluation failed:', err);
    process.exit(1);
  });
}