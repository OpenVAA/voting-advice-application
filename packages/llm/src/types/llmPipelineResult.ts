import type { PipelineMetrics } from '@openvaa/core';
import type { LanguageModelUsage as TokenUsage } from 'ai';

/**
 * An interface that contains metrics that are shared among all LLM calls.
 * Can be used to track the metrics of a single LLM call or multiple LLM calls.
 *
 * @example
 *
 * const metrics: LLMPipelineMetrics = {
 *   processingTimeMs: 420,
 *   nLlmCalls: 66,
 *   costs: { input: 0.5, output: 0.5, total: 1 },
 *   tokens: { inputTokens: 6700, outputTokens: 6800, totalTokens: 13500 }
 * };
 */
export interface LLMPipelineMetrics extends PipelineMetrics {
  nLlmCalls: number;
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

  /** The specific data payload for this result. Contains the specific metrics, metadata etc. */
  data: TData;

  /** Generation metrics */
  llmMetrics: LLMPipelineMetrics;

  /** Whether generation was successful */
  success: boolean;

  /** Metadata about the generation run */
  metadata: {
    modelsUsed: Array<string>;
    language: string;
    startTime: Date;
    endTime: Date;
  };
}
