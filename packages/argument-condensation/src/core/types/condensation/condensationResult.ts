import type { Argument } from './argument';
import type { CondensationOutputType } from './condensationType';

/**
 * Performance metrics for evaluating condensation quality and efficiency.
 * This interface can contain either metrics for a single run or for multiple runs.
 *
 * @example
 *
 * const metrics: CondensationRunMetrics = {
 *   duration: 420,
 *   nLlmCalls: 66,
 *   cost: 1.01,
 *   tokensUsed: { inputs: 6700, outputs: 6800, total: 13500 }
 * };
 */
export interface CondensationRunMetrics {
  /** Duration in seconds */
  duration: number;
  nLlmCalls: number;
  /** Cost in dollars */
  cost: number;
  tokensUsed: {
    inputs: number;
    outputs: number;
    total: number;
  };
}

/**
 * Complete result of a condensation run.
 * Contains arguments, metadata, and evaluation metrics.
 * A single run contains only one type of output, so processing a question usually
 * involves multiple runs with different output types, e.g. finding pros and cons separately.
 *
 * @example
 *
 * const result: CondensationRunResult = {
 *   runId: 'i-am-a-unique-run-id',
 *   condensationType: 'likertCons',
 *   arguments: [],
 *   metrics: {
 *     duration: 420,
 *     nLlmCalls: 66,
 *     cost: 1.01,
 *     tokensUsed: { inputs: 6700, outputs: 6800, total: 13500 }
 *   },
 *   success: true,
 *   metadata: {
 *     llmModel: 'gpt-4o',
 *     language: 'en',
 *     startTime: new Date(),
 *     endTime: new Date()
 *   }
 */
export interface CondensationRunResult {
  runId: string;
  /** The type of condensation run. Common types are likertCons, likertPros, categoricalPros, booleanCons and booleanPros */
  condensationType: CondensationOutputType;
  arguments: Array<Argument>;
  /** Performance metrics containing duration, number of LLM calls, cost, and token usage */
  metrics: CondensationRunMetrics;
  success: boolean;
  /** Metadata containing the LLM model, language, start and end times */
  metadata: {
    llmModel: string;
    language: string;
    startTime: Date;
    endTime: Date;
  };
}
