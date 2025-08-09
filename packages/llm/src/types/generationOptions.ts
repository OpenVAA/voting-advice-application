import type { LLMResponseContract } from '../utils';
import type { Message } from './index';

/**
 * Basic generation options that are common across all LLM generation methods
 */
export interface BaseGenerationOptions {
  /** Array of messages to send to the LLM */
  messages: Array<Message>;
  /** Controls randomness in the response (0-1) */
  temperature?: number;
  /** Optional maximum number of tokens to generate */
  maxTokens?: number;
  /** Optional model to use for this request, overriding the provider's default model */
  model?: string;
}

/**
 * Generation options with retry-specific parameters
 */
export interface RetryGenerationOptions extends BaseGenerationOptions {
  /** Optional maximum number of attempts to make before giving up */
  maxAttempts?: number;
  /** Optional time to wait between attempts if parsing the response timeout info fails */
  defaultWaitTime?: number;
}

/**
 * Generation options with validation-specific parameters
 */
export interface ValidationGenerationOptions<TType> extends BaseGenerationOptions {
  /** Contract to validate the response against */
  responseContract: LLMResponseContract<TType>;
  /** Number of validation attempts. Default is 3. Doesn't account for retries related to network errors */
  validationAttempts?: number;
}

/**
 * Options for parallel generation methods
 */
export interface ParallelGenerationOptions {
  /** Array of generation input parameters */
  inputs: Array<BaseGenerationOptions>;
  /** Optional maximum number of parallel batches to use. Default is 3 */
  parallelBatches?: number;
}

/**
 * Options for parallel generation with validation
 */
export interface ParallelValidationGenerationOptions<TType> extends ParallelGenerationOptions {
  /** Contract to validate the response against. If provided, the method will return parsed responses */
  responseContract: LLMResponseContract<TType>;
  /** Optional number of validation attempts per input. Default is 3 */
  validationAttempts?: number;
}
