import type { CondensationOperation } from '../condensation/operation';

/**
 * Represents a single API call. Contains the raw input and output of the call with knowledge of the usage context
 *
 * @example
 *
 * const promptCall: PromptCall = {
 *   promptTemplateId: '123',
 *   operation: "map",
 *   rawInputText: 'The input text for the prompt',
 *   rawOutputText: 'The output text for the prompt',
 *   modelUsed: 'gpt-4o',
 *   timestamp: '2021-01-01T00:00:00.000Z',
 *   metadata: {
 *     tokens: {
 *       input: 100,
 *       output: 200,
 *       total: 300
 *     },
 *     latency: 1000,
 *     cost: 0.10
 *   }
 * };
 */
export interface CondensationPromptCall {
  /** The prompt template this call used */
  promptTemplateId: string;
  /** The operation this prompt is associated with, e.g. map, refine, etc */
  operation: CondensationOperation;
  rawInputText: string;
  rawOutputText: string;
  modelUsed: string;
  timestamp: string;
  metadata: {
    /** The number of tokens used for the prompt */
    tokens: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      reasoningTokens?: number;
      cachedInputTokens?: number;
    };
    /** The latency of the prompt (ms) */
    latency: number;
    /** The cost of the prompt ($) */
    cost: number;
  };
}
