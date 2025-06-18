import { PipelineSignature } from '../../../core/types/pipelineSignature';
/**
 * Performance metrics for a question.
 * 
 * @property questionId - The ID of the VAA question
 * @property historyOfRuns - The history of condensation runs for this question
 * @property historicalAverage - The average score of all runs
 * @property bestScore - The best score of the condensation runs
 * @property bestRun - The best condensation run
 * @property last5Average - The average score of the last 5 condensation runs
 */
export interface QuestionPerformanceMetrics {
  questionId: string;
  historyOfRuns: {
    runId: string;
    pipelineSignature: PipelineSignature;
    score: number;
    timestamp: string;
  }[];
  historicalAverage: number;
  bestScore: number;
  bestRun: {
    runId: string;
    pipelineSignature: PipelineSignature;
    score: number;
    timestamp: string;
  };
  last5Average: number;
}

/**
 * Represents a coordinated run over the whole golden set to evaluate the performance of a specific set of prompts.
 *
 * @property batchRunId - The ID of the batched run
 * @property pipelineSignature - The pipeline signature: {phase, promptId} pairs
 * @property questionIds - The set of questions included in this batch
 * @property runIdsByQuestion - A map of question IDs to run IDs
 * @property scoresByQuestion - A map of question IDs to scores
 * @property timestamp - The timestamp of the batch run
 * @property averageScore - The average score of the batch run
 */
export interface GoldenDatasetBatchRun {
  batchRunId: string;
  pipelineSignature: PipelineSignature;
  questionIds: string[];
  runIdsByQuestion: { [questionId: string]: string };
  scoresByQuestion: { [questionId: string]: number };
  timestamp: string;
  averageScore: number;
}


/**
 * Global performance metrics used to track the best performing pipeline signature across the whole golden dataset. 
 * 
 * @property batchRunIds - The IDs of all batch runs (each covers all golden test cases with the same prompts)
 * @property historicalAverageScore - The average score of all batch runs
 * @property bestScore - The best average score across all batch runs
 * @property bestBatchRun - The batch run with the best average score
 * @property last5Average - The average score of the last 5 batch runs
 */
export interface GlobalPerformanceMetrics {
  batchRunIds: string[];
  historicalAverageScore: number;
  bestScore: number;
  bestBatchRun: GoldenDatasetBatchRun;
  last5Average: number;
}