import { condenseArguments } from '../core/condenseArguments';
import { CondensationSessionConfig } from '../core/types/condensationInput';
import { SystemEvaluationResult } from './types/evaluationOutput';
import { SingleEvaluationInput, SystemEvaluationInput } from './types/evaluationInput';
import type { VAAComment } from '../core/types/condensationInput';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Argument } from '../core/types/argument';
import { BaseEvaluator } from './evaluators/abstractEvaluator';
import { CondensationOutputType } from '../core/types/condensationType';

// Helper to load JSON
async function loadJson<T>(filePath: string): Promise<T> {
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data) as T;
}

// Helper to get all topics for a condensation type
async function getTopicsForType(type: string): Promise<string[]> {
  const baseDir = path.join(__dirname, 'goldenDatasets', type);
  const allNames = await fs.readdir(baseDir);
  const dirs: string[] = [];
  for (const name of allNames) {
    if ((await fs.stat(path.join(baseDir, name))).isDirectory()) {
      dirs.push(name);
    }
  }
  return dirs;
}

// Evaluate all topics for a single condensation type
export async function runTypePerformanceEval(
  condensationType: CondensationOutputType,
  config: CondensationSessionConfig,
  evaluator: BaseEvaluator
): Promise<SystemEvaluationResult> {
  const topics = await getTopicsForType(condensationType);
  const evalInputs: SingleEvaluationInput[] = await Promise.all(
    topics.map(async topic => {
      const baseDir = path.join(__dirname, 'goldenDatasets', condensationType, topic);
      const comments: VAAComment[] = await loadJson(path.join(baseDir, 'inputComments.json'));
      const expectedArguments = await loadJson(path.join(baseDir, 'targetArguments.json'));

      const condensationInput = {
        sessionId: `perf-${condensationType}-${topic}`,
        comments,
        topic,
        config
      };

      const condensationResult = await condenseArguments(condensationInput);

      return {
        topic,
        systemArguments: condensationResult.arguments,
        expectedArguments: expectedArguments as Argument[]
      };
    })
  );

  const systemEvalInput: SystemEvaluationInput = {
    description: `Performance evaluation for ${condensationType}`,
    inputs: evalInputs
  };

  const systemResult = await evaluator.evaluateSystem(systemEvalInput);

  // Print results
  systemResult.results.forEach(r =>
    console.log(`[${condensationType}] Tested topic: ${r.topic} | Score: ${r.score}`)
  );
  console.log(`\n[${condensationType}] Performance Summary:`);
  console.log(systemResult.metrics);

  return systemResult;
}

// Run performance eval for all types and aggregate
export async function runAllTypesPerformanceEval(
  configs: Record<CondensationOutputType, CondensationSessionConfig>,
  evaluator: BaseEvaluator
) {
  const condensationTypes = Object.keys(configs) as CondensationOutputType[];
  const allResults: { type: CondensationOutputType; result: SystemEvaluationResult }[] = [];

  for (const type of condensationTypes) {
    const result = await runTypePerformanceEval(type, configs[type], evaluator);
    allResults.push({ type, result });
  }

  // Aggregate overall metrics
  const allScores = allResults.flatMap(r => r.result.results.map(res => res.score));
  const overallMetrics = {
    averageScore: allScores.reduce((a, b) => a + b, 0) / allScores.length,
    bestScore: Math.max(...allScores),
    worstScore: Math.min(...allScores),
    totalTestCases: allScores.length
  };

  console.log('\n=== Overall System Performance Summary ===');
  console.log(overallMetrics);

  return {
    perType: allResults,
    overall: overallMetrics
  };
}

// Example usage
// import { StubEvaluator } from './evaluators/stubEvaluator';
// const evaluator = new StubEvaluator(7, "Stub evaluation");
// const configs = { likertPros: prosConfig, likertCons: consConfig, categorical: categoricalConfig };
// runAllTypesPerformanceEval(configs, evaluator);
