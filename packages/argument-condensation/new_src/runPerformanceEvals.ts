import currentEvalConfig from './config/currentEvalConfig';
import { Condenser } from './core/condenser';
import { GoldenTestCase } from './evaluation/types/goldenTestCase';
import { BatchCondensationConfig } from './evaluation/types/performanceEvalConfig';
import { PerformanceTracker } from './evaluation/performanceTracker';
import { PerformanceAnalytics } from './cli/performanceAnalytics';
import { BaseEvaluator } from './evaluation/evaluators/abstractEvaluator';
import { StubEvaluator } from './evaluation/evaluators/stubEvaluator';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CONDENSATION_TYPE } from './core/types/condensationType';
import { CondensationRunResult } from './core/types';
import { SystemEvaluationResult } from './evaluation/types/evaluationOutput';
import { CondensationPlan } from './core/types/condensation/processDefinition';
import { CondensationOperations } from './core/types/condensation/operation';

// Utility: Recursively find all test case directories
async function findTestCaseDirs(root: string): Promise<string[]> {
  const dirs: string[] = [];
  console.log("Reading elections from:", root);
  const elections = await fs.readdir(root);
  console.log("Found elections:", elections);
  
  for (const election of elections) {
    const electionPath = path.join(root, election);
    console.log("Checking election path:", electionPath);
    const stat = await fs.stat(electionPath);
    if (!stat.isDirectory()) continue;
    const questions = await fs.readdir(electionPath);
    for (const questionId of questions) {
      const questionPath = path.join(electionPath, questionId);
      const qStat = await fs.stat(questionPath);
      if (qStat.isDirectory()) {
        dirs.push(questionPath);
      }
    }
  }
  return dirs;
}

// Utility: Load a single test case
async function loadTestCase(dir: string): Promise<GoldenTestCase> {
  return {
    topic: 'Should taxes be raised to fund public healthcare?',
    comments: [
      { id: 'mockComment1', text: 'Test comment 1', candidateID: 'candA', candidateAnswer: '3' },
      { id: 'mockComment2', text: 'Test comment 2', candidateID: 'candB', candidateAnswer: '5' }
    ],
    expectedArguments: [
      { id: 'arg1', text: 'Healthcare needs more funding' },
      { id: 'arg2', text: 'Tax increase is justified for better healthcare' }
    ],
    condensationType: CONDENSATION_TYPE.LIKERT.PROS,
  };
}

async function main() {
  try {
    // Log the directory we're starting from
    console.log("Current directory (__dirname):", __dirname);
    
    // Log the path we're trying to access
    const root = path.join(__dirname, 'evaluation', 'goldenDatasets', 'likertCons');
    console.log("Trying to access directory:", root);

    // Log what we find in the directory
    console.log("Reading directory contents...");
    const contents = await fs.readdir(root);
    console.log("Directory contents:", contents);

    const testCaseDirs = await findTestCaseDirs(root);
    console.log("Found test case directories:", testCaseDirs);

    // 2. Load all test cases
    const testCases: GoldenTestCase[] = [];
    for (const dir of testCaseDirs) {
      testCases.push(await loadTestCase(dir));
    }

    // 3. Prepare config for this batch
    const batchConfig: BatchCondensationConfig = {
      ...currentEvalConfig,
      testCases,
    };

    // 4. Run all condensers
    const runPromises = testCases.map(testCase => {
      const runInput = {
        runId: batchConfig.batchRunId,
        electionId: 'mockElectionId',
        question: {
          id: 'mockQuestionId',
          topic: testCase.topic ?? 'Mock Topic', // If available
          answerType: 'likert-5',
        },
        comments: testCase.comments,
        config: batchConfig.plan
      };
      return new Condenser(runInput).run();
    });

    const results: CondensationRunResult[] = await Promise.all(runPromises);

    // 5. Evaluate results using evaluator
    const evaluator: BaseEvaluator = new StubEvaluator(8.7, "Stub evaluation for testing");
    
    // Create evaluation inputs from results and test cases
    const evaluationInputs = results.map((result, idx) => ({
      topic: testCases[idx].topic,
      systemArguments: result.arguments,
      expectedArguments: testCases[idx].expectedArguments
    }));
    
    // Run evaluation for each test case
    const evaluationResult: SystemEvaluationResult = await evaluator.evaluateSystem({ 
      description: "Batch evaluation of condensation system",
      inputs: evaluationInputs 
    });
    
    // Create a map of evaluation results (to ensure results are in correct order)
    const evaluationResultsByTopic = new Map(
      evaluationResult.results.map(result => [result.topic, result])
    );
    
    // Extract scores from evaluation results using topic matching (order-agnostic)
    const scoresByQuestion = Object.fromEntries(
      results.map(result => [
        result.input.question.id, 
        evaluationResultsByTopic.get(result.input.question.topic)?.score ?? 0
      ])
    );
    
    const averageScore = evaluationResult.metrics.averageScore;

    // 6. Aggregate and save performance metrics
    const tracker = new PerformanceTracker();
    
    const batchRun = {
      batchRunId: batchConfig.batchRunId,
      nTestCases: testCases.length,
      plan: batchConfig.plan,
      questionIds: results.map(result => result.input.question.id),
      runIdsByQuestion: Object.fromEntries(
        results.map(result => [result.input.question.id, result.runId])
      ),
      scoresByQuestion,
      timestamp: new Date().toISOString(),
      averageScore,
    };
    await tracker.saveBatchRunAndUpdateGlobal(batchRun);

    // 7. Run performance analytics and display results
    const analytics = new PerformanceAnalytics();
    const testCaseScores = Object.entries(batchRun.scoresByQuestion).map(([testCaseId, score]) => ({
      testCaseId,
      score
    }));
    
    const analyticsResult = await analytics.analyzePerformance(batchRun.averageScore, testCaseScores);
    analytics.displayAnalytics(analyticsResult);
  } catch (error) {
    console.error("Error in main:", error);
  }
}

main().catch(console.error);
