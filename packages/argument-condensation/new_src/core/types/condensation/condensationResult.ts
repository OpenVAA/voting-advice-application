import { CondensationRunInput } from './condensationInput';
import { Argument } from '../base/argument';

/**
 * Performance metrics for evaluating condensation quality and efficiency.
 *
 * @property duration - Time taken for the condensation process (seconds)
 * @property nLlmCalls - Number of LLM API calls made
 * @property cost - Cost of the condensation process (EUR)
 * @property tokensUsed - Number of tokens used in the condensation process
 */
export interface CondensationRunMetrics {
  duration: number; // seconds
  nLlmCalls: number;
  cost: number; // EUR
  tokensUsed: {
    inputs: number;
    outputs: number;
    total: number;
  };
}

/**
 * Complete result of a condensation run.
 * Contains arguments, metadata, and evaluation metrics.
 *
 * @property runId - Unique identifier for this run
 * @property input - Input parameters used for this run
 * @property arguments - Extracted arguments
 * @property metrics - Performance metrics
 * @property success - Whether the run was successful
 * @property metadata - Additional metadata
 */
export interface CondensationRunResult {
  runId: string;
  input: CondensationRunInput;
  arguments: Array<Argument>;
  metrics: CondensationRunMetrics;
  success: boolean;
  metadata: {
    llmModel: string;
    language: string;
    startTime: Date;
    endTime: Date;
  };
}
