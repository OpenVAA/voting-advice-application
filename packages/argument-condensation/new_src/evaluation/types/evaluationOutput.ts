import { SingleEvaluationInput } from './evaluationInput';

/**
 * Result from evaluating a single test case.
 * @param topic - The topic of the test case
 * @param score - The score of the system output
 * @param explanation - Qualitative explanation
 * @param input - The original input that was evaluated
 */
export interface SingleEvaluationResult {
  topic: string;
  score: number; // 0-10
  explanation: string;
  input: SingleEvaluationInput;
}

/**
 * Evaluation of the condensation system's performance.
 * @param results - Array of individual test results
 * @param metrics - Metrics of the evaluation
 */
export interface SystemEvaluationResult {
  results: SingleEvaluationResult[];
  metrics: {
    averageScore: number;
    bestScore: number;
    worstScore: number;
    totalTestCases: number;
  };
}
