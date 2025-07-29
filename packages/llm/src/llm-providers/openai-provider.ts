import OpenAI from 'openai';
import { LLMProvider } from './llm-provider';
import { LLMResponse, Message, TokenUsage, } from '../types';
import { mapToMessageParam } from '../utils';
import { parseWaitTimeFromError } from '../utils/parseRateLimitError';

/** OpenAI implementation of the LLMProvider class. 
 * 
 * @example
 * const openaiProvider = new OpenAIProvider({
 *   apiKey: 'your-openai-api-key',
 *   model: 'gpt-4o',
 *   maxContextTokens: 4096,
 *   fallbackModel: 'gpt-3.5-turbo'
 * });
 * 
 * const response = await openaiProvider.generate({
 *   messages: [{ role: 'user', content: 'Hello, world!' }],
 *   temperature: 0.7,
 *   maxTokens: 100
 * });
 * 
 * const parallelResponses = await openaiProvider.generateMultipleParallel({
 *   inputs: [
 *     { messages: [{ role: 'user', content: 'Hello, world!' }], temperature: 0.7, maxTokens: 100 },
 *     { messages: [{ role: 'user', content: 'Hello, world!', temperature: 0.7, maxTokens: 100 }],
 *   ],
 *   parallelBatches: 3
 * });
 */
export class OpenAIProvider extends LLMProvider {
  public model: string;
  private openai: OpenAI;
  public readonly maxContextTokens: number;
  private fallbackModel?: string;

  constructor({
    model = 'gpt-4o',
    apiKey,
    maxContextTokens = 4096,
    fallbackModel
  }: {
    apiKey: string;
    model?: string;
    maxContextTokens?: number;
    fallbackModel?: string;
  }) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required in constructor options.');
    }
    super();
    this.model = model;
    this.maxContextTokens = maxContextTokens;
    this.openai = new OpenAI({ apiKey });
    this.fallbackModel = fallbackModel;
  }

  async generate({
    messages,
    temperature = 0.7,
    maxTokens,
    model
  }: {
    messages: Array<Message>;
    temperature?: number;
    maxTokens?: number;
    model?: string;
  }): Promise<LLMResponse> {
    if (!messages || messages.length === 0) {
      throw new Error('At least one message is required for generation');
    }

    if (temperature < 0 || temperature > 1) {
      throw new Error('Temperature must be between 0 and 1');
    }

    // Use model given as a parameter or fall back to the default provider model (can also be set in the constructor)
    const modelToUse = model || this.model;

    try {
      const openAIMessages: Array<OpenAI.ChatCompletionMessageParam> = messages.map(mapToMessageParam);

      const response = await this.openai.chat.completions.create({
        model: modelToUse,
        messages: openAIMessages,
        temperature,
        max_tokens: maxTokens
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error('OpenAI API returned no choices');
      }

      const contentObject = response.choices[0];
      const usage = response.usage;

      if (!contentObject.message.content) {
        throw new Error('OpenAI API returned empty content');
      }

      const llmResponse: LLMResponse = {
        content: contentObject.message.content,
        usage: {
          promptTokens: usage?.prompt_tokens ?? 0,
          completionTokens: usage?.completion_tokens ?? 0,
          totalTokens: usage?.total_tokens ?? 0
        } as TokenUsage,
        model: response.model,
        finishReason: contentObject.finish_reason
      };
      return llmResponse;
    } catch (error) {
      // Handle error gracefully in caller
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while calling OpenAI API');
    }
  }

  /**
   * Generates a response from the LLM with retry logic
   * @param messages Array of messages to send to the LLM
   * @param temperature Controls randomness in the response (0-1)
   * @param maxTokens Optional maximum number of tokens to generate
   * @param model Optional model to use for this request, overriding the provider's default model
   * @param maxAttempts Optional maximum number of attempts to generate a response. Default is 3.
   * @param defaultWaitTime Optional default wait time in milliseconds between attempts. Default is 0.
   */
  async generateWithRetry({
    messages,
    temperature = 0.7,
    maxTokens,
    model,
    maxAttempts = 3,
    defaultWaitTime = 0
  }: {
    messages: Array<Message>;
    temperature?: number;
    maxTokens?: number;
    model?: string;
    maxAttempts?: number;
    defaultWaitTime?: number;
  }): Promise<LLMResponse> {
    const modelToUse = model || this.model;
    let lastError: Error | null = null;

    // Try to generate the response up to maxAttempts times 
    // If we get a rate limit error (429), try to parse the wait time and retry afterwards, otherwise use default wait time
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.generate({
          messages,
          temperature,
          maxTokens,
          model: modelToUse
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error during generation');
        // If it's not the last attempt, wait and retry
        if (attempt < maxAttempts - 1) {
          const waitTime =
            error instanceof Error && error.message.includes('429') // Yes, you can use a more robust method but this works too
              ? parseWaitTimeFromError(error.message) || defaultWaitTime
              : defaultWaitTime;
          console.info(
            `Attempt ${attempt + 1} failed for model ${modelToUse}. Waiting ${waitTime}ms before retrying...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    // If all retries fail, try the fallback model if it exists and wasn't the one that just failed
    if (this.fallbackModel && modelToUse !== this.fallbackModel) {
      console.info(`All retries failed for ${modelToUse}. Attempting to use fallback model ${this.fallbackModel}...`);
      try {
        return await this.generate({
          messages,
          temperature,
          maxTokens,
          model: this.fallbackModel
        });
      } catch (fallbackError) {
        lastError = new Error(
          `Primary model '${modelToUse}' failed after ${maxAttempts} attempts. Fallback model '${this.fallbackModel}' also failed. Last error: ${(fallbackError as Error).message}`
        );
        throw lastError;
      }
    }
    throw lastError;
  }

  /**
   * Generates multiple responses from the LLM by processing requests in parallel batches. Tries to prevent rate limit errors by pre-checking limits.
   * @param inputs Array of generation inputs with messages
   * @param parallelBatches Number of parallel batches to process. Default is 3.
   * @returns Promise that resolves to an array of LLM responses in the same order as inputs
   * 
   * @example
   * const parallelResponses = await openaiProvider.generateMultipleParallel({
   *   inputs: [
   *     { messages: [{ role: 'user', content: 'Hello, world!' }], temperature: 0.7, maxTokens: 100 },
   *     { messages: [{ role: 'user', content: 'Hello, world!', temperature: 0.7, maxTokens: 100 }],
   *   ],
   *   parallelBatches: 3
   * });
   */
  async generateMultipleParallel({
    inputs,
    parallelBatches = 3
  }: {
    inputs: Array<{
      messages: Array<Message>;
      temperature: number;
      maxTokens?: number;
      model?: string;
    }>;
    parallelBatches: number;
  }): Promise<Array<LLMResponse>> {
    if (!inputs || inputs.length === 0) {
      return [];
    }

    // Validate inputs before processing
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      if (!input.messages || input.messages.length === 0) {
        throw new Error(`Input at index ${i}: At least one message is required for generation`);
      }
      if (input.temperature < 0 || input.temperature > 1) {
        throw new Error(`Input at index ${i}: Temperature must be between 0 and 1`);
      }
    }

    const results: Array<LLMResponse> = [];

    for (let i = 0; i < inputs.length; i += parallelBatches) {
      const batch = inputs.slice(i, i + parallelBatches);

      const modelForBatch = inputs[0].model || this.model;

      // Process each item in the batch individually with its own fallback logic
      const batchPromises = batch.map(async (input) => {
        return this.generateWithRetry({
          messages: input.messages,
          temperature: input.temperature,
          maxTokens: input.maxTokens,
          model: modelForBatch
        });
      });

      // Wait for current batch to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    return results;
  }

  /**
   * Generates multiple responses from the LLM by processing requests in sequence.
   * @param inputs Array of generation input parameters
   * @returns Promise that resolves to an array of LLM responses in the same order as inputs
   */
  async generateMultipleSequential({
    inputs
  }: 
  {
    inputs: Array<{
      messages: Array<Message>;
      temperature: number;
      maxTokens?: number;
      model?: string;
    }>;
  }): Promise<Array<LLMResponse>> {
    if (!inputs || inputs.length === 0) {
      return [];
    }

    const results: Array<LLMResponse> = [];

    for (const input of inputs) {
      const result = await this.generateWithRetry({
        messages: input.messages,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
        model: input.model
      });
      results.push(result);
    }

    return results;
  }
}
