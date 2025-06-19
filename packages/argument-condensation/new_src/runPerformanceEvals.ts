import currentEvalConfig from './config/currentEvalConfig';
import { Condenser } from './core/condenser';
import { GoldenTestCase } from './evaluation/types/goldenTestCase';
import { BatchCondensationConfig } from './evaluation/types/performanceEvalConfig';
import { PerformanceTracker } from './evaluation/performanceTracker';
import { PerformanceAnalytics } from './cli/performanceAnalytics';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CONDENSATION_TYPE } from './core/types/condensationType';
import { CondensationPhase } from './core/types/condensationPhase';
import { CondensationRunResult } from './core/types';

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
        runId: `mockRunId-001`,
        electionId: 'mockElectionId',
        question: {
          id: 'mockQuestionId',
          topic: testCase.topic ?? 'Mock Topic', // If available
          answerType: 'likert-5',
        },
        comments: [],
        config: {
          batchSize: batchConfig.batchSize,
          nOutputArgs: batchConfig.nOutputArgs,
          language: batchConfig.language,
          initialCondensationPrompt: batchConfig.pipelineSignature.initialCondensationPrompt,
          mainCondensationPrompt: batchConfig.pipelineSignature.mainCondensationPrompt,
          argumentImprovementPrompt: batchConfig.pipelineSignature.argumentImprovementPrompt,
          condensationType: CONDENSATION_TYPE.LIKERT.PROS,
        }
      };
      return new Condenser(runInput).run();
    });

    const results: CondensationRunResult[] = await Promise.all(runPromises);

    // 5. Aggregate and save performance metrics
    const tracker = new PerformanceTracker();
    const batchRun = {
      batchRunId: batchConfig.batchRunId,
      nTestCases: testCases.length,
      pipelineSignature: [
        { phase: 'initialCondensation' as CondensationPhase, promptId: 'mockInitialPrompt_v1' },
        { phase: 'mainCondensation' as CondensationPhase, promptId: 'mockMainPrompt_v1' },
        { phase: 'full' as CondensationPhase, promptId: 'mockImprovePrompt_v1' }
      ],
      questionIds: results.map((_, idx) => `mockQuestionId${idx + 1}`),
      runIdsByQuestion: Object.fromEntries(
        results.map((r, idx) => [`mockQuestionId${idx + 1}`, r.runId])
      ),
      scoresByQuestion: Object.fromEntries(
        results.map((r, idx) => [`mockQuestionId${idx + 1}`, 7])
      ),
      timestamp: new Date().toISOString(),
      averageScore: 7,
    };
    await tracker.saveBatchRunAndUpdateGlobal(batchRun);

    // 6. Run performance analytics and display results
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
