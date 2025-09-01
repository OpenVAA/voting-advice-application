import OpenAI from 'openai';
import { LLMProvider } from './llm-provider';
import { isValidationError, mapToMessageParam, parseAndValidate } from '../utils';
import { parseWaitTimeFromError } from '../utils/parseRateLimitError';
import type { Controller } from '@openvaa/core';
import type {
  BaseGenerationOptions,
  LLMResponse,
  ParallelGenerationOptions,
  ParallelValidationGenerationOptions,
  ParsedLLMResponse,
  RetryGenerationOptions,
  TokenUsage,
  ValidationGenerationOptions
} from '../types/';
import type { ValidationError } from '../utils';

/**
 * OpenAI implementation of the LLMProvider abstract class.
 *
 * This class provides a concrete implementation of the LLMProvider interface
 * for OpenAI's API, handling authentication, request formatting, response parsing,
 * and error handling specific to OpenAI's services.
 *
 * @example
 * ```typescript
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
 *     { messages: [{ role: 'user', content: 'Hello, world!' }], temperature: 0.7, maxTokens: 100 }
 *   ],
 *   parallelBatches: 3
 * });
 * ```
 */
export class OpenAIProvider extends LLMProvider {
  public readonly name = 'openai';
  public model: string;
  private openai: OpenAI;
  public readonly maxContextTokens: number;
  private fallbackModel?: string;

  /**
   * Creates a new OpenAI provider instance.
   *
   * @param options - Configuration options for the OpenAI provider
   * @param options.apiKey - OpenAI API key (required)
   * @param options.model - Model to use for generation (default: 'gpt-4o')
   * @param options.maxContextTokens - Maximum context tokens (default: 4096)
   * @param options.fallbackModel - Optional fallback model to use if primary model fails
   */
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

  /**
   * Generates a response from the OpenAI LLM.
   *
   * This method implements the abstract generate method from LLMProvider.
   * It handles the core generation logic without retry or validation features.
   * For production use, consider using generateWithRetry or generateAndValidateWithRetry.
   *
   * @param options - Generation options
   * @param options.messages - Array of messages to send to the LLM
   * @param options.temperature - Optional temperature controlling randomness (0-1, default: 0.7)
   * @param options.maxTokens - Optional maximum number of tokens to generate
   * @param options.model - Optional model to use for this request, overriding the provider's default model
   * @returns Promise resolving to an LLMResponse
   * @throws Error if messages are empty, temperature is invalid, or API call fails
   */
  async generate(options: BaseGenerationOptions): Promise<LLMResponse> {
    const { messages, temperature = 0.7, maxTokens, model } = options;

    if (!messages || messages.length === 0) {
      throw new Error('At least one message is required for generation');
    }

    if (temperature !== undefined && (temperature < 0 || temperature > 1)) {
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

  // ------------------------------------------------------------------------------------------------
  // Methods for retrying responses. First one retries on network errors,
  // second one retries on network errors and validation errors (it uses the first one internally).
  // ------------------------------------------------------------------------------------------------

  /**
   * Generates a response from the OpenAI LLM with retry logic.
   *
   * This method implements the abstract generateWithRetry method from LLMProvider.
   * It handles network errors and rate limiting with automatic retries and fallback model support.
   *
   * @param options - Generation options with retry configuration
   * @param options.messages - Array of messages to send to the LLM
   * @param options.temperature - Optional temperature controlling randomness (0-1, default: 0.7)
   * @param options.maxTokens - Optional maximum number of tokens to generate
   * @param options.model - Optional model to use for this request, overriding the provider's default model
   * @param options.maxAttempts - Optional maximum number of attempts to generate a response (default: 3)
   * @param options.defaultWaitTime - Optional default wait time in milliseconds between attempts (default: 0)
   * @returns Promise resolving to an LLMResponse
   * @throws Error if all retry attempts fail, including fallback model attempts
   */
  async generateWithRetry(options: RetryGenerationOptions): Promise<LLMResponse> {
    const { messages, temperature = 0.7, maxTokens, model, maxAttempts = 3, defaultWaitTime = 0 } = options;
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
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    // If all retries fail, try the fallback model if it exists and wasn't the one that just failed
    if (this.fallbackModel && modelToUse !== this.fallbackModel) {
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
   * Generates a validated response from the OpenAI LLM with retry logic for both network and validation errors.
   *
   * This method implements the abstract generateAndValidateWithRetry method from LLMProvider.
   * It combines network retry logic with response validation and parsing.
   *
   * @param options - Generation options with validation configuration
   * @param options.messages - Array of messages to send to the LLM
   * @param options.temperature - Optional temperature controlling randomness (0-1, default: 0.7)
   * @param options.maxTokens - Optional maximum number of tokens to generate
   * @param options.model - Optional model to use for this request, overriding the provider's default model
   * @param options.responseContract - Contract to validate the response against
   * @param options.validationAttempts - Number of validation attempts (default: 3)
   * @returns Promise resolving to a ParsedLLMResponse with both raw and parsed data
   * @throws Error if all validation attempts fail
   */
  async generateAndValidateWithRetry<TType>(
    options: ValidationGenerationOptions<TType>
  ): Promise<ParsedLLMResponse<TType>> {
    const { messages, temperature, maxTokens, model, responseContract, validationAttempts = 3 } = options;
    let lastValidationError: ValidationError | null = null;

    for (let attempt = 0; attempt < validationAttempts; attempt++) {
      // Get a response, allowing network retries
      const llmResponse = await this.generateWithRetry({
        messages,
        temperature,
        maxTokens,
        model
      });

      try {
        // Attempt to parse and validate the response
        const parsed = parseAndValidate(llmResponse.content, responseContract);
        const result: ParsedLLMResponse<TType> = {
          parsed,
          raw: llmResponse
        };
        return result;
      } catch (error) {
        if (isValidationError(error)) {
          lastValidationError = error;
          // If it's the last attempt, the error will be thrown after the loop
        } else {
          // For unexpected errors, rethrow immediately
          throw error;
        }
      }
    }

    // If all validation attempts fail, throw the last validation error
    throw new Error(
      `All ${validationAttempts} validation attempts failed. Last error: ${lastValidationError?.message}`
    );
  }

  // --------------------------------------------------------------------------------------
  // Generate multiple responses in sequence. Has network retry but no object validation.
  // --------------------------------------------------------------------------------------

  /**
   * Generates multiple responses from the OpenAI LLM by processing requests in sequence.
   *
   * This method implements the abstract generateMultipleSequential method from LLMProvider.
   * It processes each input sequentially with network retry support but no validation.
   *
   * @param options - Parallel generation options
   * @param options.inputs - Array of generation input parameters
   * @returns Promise that resolves to an array of LLM responses in the same order as inputs
   */
  async generateMultipleSequential(options: ParallelGenerationOptions): Promise<Array<LLMResponse>> {
    const { inputs } = options;
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

  // ------------------------------------------------------------------------------------------------
  // Parallel generation. Has network retry and object validation with retry. Overloaded to handle both.
  // ------------------------------------------------------------------------------------------------

  // Overload for validation
  async generateMultipleParallel<TType>(
    options: ParallelValidationGenerationOptions<TType>,
    controller?: Controller
  ): Promise<Array<ParsedLLMResponse<TType>>>;

  // Overload for no validation
  async generateMultipleParallel(
    options: ParallelGenerationOptions,
    controller?: Controller
  ): Promise<Array<LLMResponse>>;

  /**
   * Generates multiple responses from the OpenAI LLM in parallel batches.
   *
   * This method implements the abstract generateMultipleParallel method from LLMProvider.
   * It can handle both validated and non-validated responses based on the options provided.
   * Supports parallel processing with configurable batch sizes and validation retry logic.
   *
   * @param options - Parallel generation options with optional validation
   * @param options.inputs - Array of generation input parameters
   * @param options.parallelBatches - Optional maximum number of parallel batches (default: 3)
   * @param options.responseContract - Optional contract for validation (if provided, returns parsed responses)
   * @param options.validationAttempts - Optional validation attempts per input (default: 3)
   * @param controller - Optional controller for progress tracking
   * @returns Promise resolving to an array of LLM responses or parsed responses in the same order as inputs
   * @throws Error if any input validation fails (temperature range, empty messages)
   */
  // Actual function implementation that can either be used with or without validation
  async generateMultipleParallel<TType>(
    options: ParallelGenerationOptions | ParallelValidationGenerationOptions<TType>,
    controller?: Controller
  ): Promise<Array<LLMResponse | ParsedLLMResponse<TType>>> {
    const { inputs, parallelBatches } = options;
    const responseContract = 'responseContract' in options ? options.responseContract : undefined;
    const validationAttempts = 'validationAttempts' in options ? options.validationAttempts : undefined;

    if (!inputs || inputs.length === 0) {
      return [];
    }

    // Validate inputs before processing
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      if (!input.messages || input.messages.length === 0) {
        throw new Error(`Input at index ${i}: At least one message is required for generation`);
      }
      if (input.temperature !== undefined && (input.temperature < 0 || input.temperature > 1)) {
        throw new Error(`Input at index ${i}: Temperature must be between 0 and 1`);
      }
    }

    const results: Array<LLMResponse | ParsedLLMResponse<TType>> = [];
    const totalBatches = Math.ceil(inputs.length / (parallelBatches ?? 3));
    let completedBatches = 0;

    for (let i = 0; i < inputs.length; i += parallelBatches ?? 3) {
      const batch = inputs.slice(i, i + (parallelBatches ?? 3));
      const batchPromises = batch.map((input) => {
        const modelForRequest = input.model || this.model;

        if (responseContract) {
          return this.generateAndValidateWithRetry({
            messages: input.messages,
            temperature: input.temperature,
            maxTokens: input.maxTokens,
            model: modelForRequest,
            responseContract,
            validationAttempts
          });
        } else {
          return this.generateWithRetry({
            messages: input.messages,
            temperature: input.temperature,
            maxTokens: input.maxTokens,
            model: modelForRequest
          });
        }
      });

      // Wait for all batches to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Update progress after each batch completes
      completedBatches++;
      if (controller) {
        if (typeof controller.getCurrentOperation === 'function') {
          console.info('progress', controller.getCurrentOperation()!.id, completedBatches / totalBatches);
        }
        controller.progress(completedBatches / totalBatches);
      }
    }

    return results;
  }
}
