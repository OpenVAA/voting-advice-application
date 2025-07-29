import { LLMResponse,Message } from '../types';

/**
 * Abstract base class for LLM providers.
 * Implement this class to add support for new LLM providers.
 */
export abstract class LLMProvider {
  /**
   * Generates a response from the LLM based on the provided messages
   * @param messages Array of messages to send to the LLM
   * @param temperature Controls randomness in the response (0-1)
   * @param maxTokens Optional maximum number of tokens to generate
   * @param model Optional model to use for this request, overriding the provider's default model
   */
  abstract generate({
    messages,
    temperature,
    maxTokens,
    model
  }: {
    messages: Array<Message>;
    temperature: number;
    maxTokens?: number;
    model?: string;
  }): Promise<LLMResponse>;

  /**
   * Generates a response from the LLM with retry logic
   * @param messages Array of messages to send to the LLM
   * @param temperature Controls randomness in the response (0-1)
   * @param maxTokens Optional maximum number of tokens to generate
   * @param model Optional model to use for this request, overriding the provider's default model
   */
  abstract generateWithRetry({
    messages,
    temperature,
    maxTokens,
    model
  }: {
    messages: Array<Message>;
    temperature: number;
    maxTokens?: number;
    model?: string;
  }): Promise<LLMResponse>;

  /**
   * Generates multiple responses from the LLM based on an array of input requests
   * @param inputs Array of input requests, each containing messages, temperature, and optional parameters
   * @param parallelBatches Optional maximum number of parallel batches to use. Default is 3.
   * @returns Promise that resolves to an array of LLM responses in the same order as inputs
   */
  abstract generateMultipleParallel({
    inputs
  }: {
    inputs: Array<{
      messages: Array<Message>;
      temperature: number;
      maxTokens?: number;
      model?: string;
    }>;
    parallelBatches?: number;
  }): Promise<Array<LLMResponse>>;

  abstract generateMultipleSequential({
    inputs
  }: {
    inputs: Array<{
      messages: Array<Message>;
      temperature: number;
      maxTokens?: number;
      model?: string;
    }>;
  }): Promise<Array<LLMResponse>>;
}
