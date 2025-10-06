import type { LanguageModelUsage as TokenUsage } from 'ai';

/**
 * An interface that contains metrics that are shared among all LLM calls.
 * Can be used to track the metrics of a single LLM call or multiple LLM calls.
 *
 * @example
 *
 * const metrics: LLMPipelineMetrics = {
 *   duration: 420,
 *   nLlmCalls: 66,
 *   cost: 1.01,
 *   tokens: { inputTokens: 6700, outputTokens: 6800, totalTokens: 13500,
 *   reasoningTokens: 0, cachedInputTokens: 0 } // optional, commonly not available if they are 0 :)
 * };
 */
export interface LLMPipelineMetrics {
  /** Duration in seconds */
  duration: number;
  nLlmCalls: number;
  /** Cost in dollars */
  cost: number;
  tokens: TokenUsage;
}

/**
 * Base result type for all LLM generation operations that are used via this package.
 * Not relevant for a single LLM call, rather a more abstract result that packages
 * generating data with LLMs use.
 *
 * Contains common fields like runId, metrics, success status, and metadata
 *
 * @template TData - The specific data payload for this result type
 */
export interface LLMPipelineResult<TData extends object> {
  /** Unique identifier for this generation run */
  runId: string;

  /** The specific data payload for this result */
  data: TData;

  /** Generation metrics */
  metrics: LLMPipelineMetrics;

  /** Whether generation was successful */
  success: boolean;

  /** Metadata about the generation run */
  metadata: {
    llmModel: string;
    language: string;
    startTime: Date;
    endTime: Date;
  };
}
