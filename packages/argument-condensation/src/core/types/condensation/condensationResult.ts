import type { LLMPipelineResult } from '@openvaa/llm-refactor';
import type { Argument } from './argument';
import type { CondensationOutputType } from './condensationType';

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
 *   data: { arguments: [] },
 *   llmMetrics: {
 *     processingTimeMs: 420,
 *     nLlmCalls: 66,
 *     costs: { input: 0.5, output: 0.51, total: 1.01 },
 *     tokens: { inputTokens: 6700, outputTokens: 6800, totalTokens: 13500 } // Optional: reasoningTokens, cachedInputTokens
 *   },
 *   success: true,
 *   metadata: {
 *     modelsUsed: ['gpt-4o'],
 *     language: 'en',
 *     startTime: new Date(),
 *     endTime: new Date()
 *   }
 * };
 */
export interface CondensationRunResult
  extends LLMPipelineResult<{
    arguments: Array<Argument>;
  }> {
  /** The type of condensation run. Common types are likertCons, likertPros, categoricalPros, booleanCons and booleanPros */
  condensationType: CondensationOutputType;
}
