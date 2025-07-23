import { CondensationOutputType } from './condensationType';
import { Argument } from '../base/argument';

/**
 * Performance metrics for evaluating condensation quality and efficiency.
 */
export interface CondensationRunMetrics {
  /** The duration of the condensation process (seconds) */
  duration: number; // seconds
  /** The number of LLM API calls made */
  nLlmCalls: number;
  /** The cost of the condensation process (EUR) */
  cost: number; // EUR
  /** The number of tokens used in the condensation process */
  tokensUsed: {
    /** The number of input tokens used */
    inputs: number;
    /** The number of output tokens used */
    outputs: number;
    /** The total number of tokens used */
    total: number;
  };
}

/**
 * Complete result of a condensation run.
 * Contains arguments, metadata, and evaluation metrics.
 */
export interface CondensationRunResult {
  /** The unique identifier for this run */
  runId: string;
  /** The type of condensation run */
  condensationType: CondensationOutputType;
  /** The extracted arguments */
  arguments: Array<Argument>;
  /** Performance metrics */
  metrics: CondensationRunMetrics;
  /** Whether the run was successful */
  success: boolean;
  /** Additional metadata */
  metadata: {
    /** The LLM model used */
    llmModel: string;
    /** The language of the input data */
    language: string;
    /** The start time of the run */
    startTime: Date;
    /** The end time of the run */
    endTime: Date;
  }; 
}
