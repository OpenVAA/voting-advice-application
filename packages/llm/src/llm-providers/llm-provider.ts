import type { LLMResponse, ParsedLLMResponse } from '../types';
import type {
  BaseGenerationOptions,
  ParallelGenerationOptions,
  ParallelValidationGenerationOptions,
  RetryGenerationOptions,
  ValidationGenerationOptions
} from '../types';

/**
 * Abstract base class for LLM providers.
 *
 * This abstract class defines the interface that all LLM provider implementations
 * must follow. It provides a consistent API for interacting with different LLM
 * services (OpenAI, Anthropic, etc.) while allowing each provider to implement
 * their own specific logic for authentication, request formatting, and response parsing.
 *
 * Implement this class to add support for new LLM providers. All abstract methods
 * must be implemented by concrete provider classes.
 *
 * @example
 * ```typescript
 * class CustomLLMProvider extends LLMProvider {
 *   readonly name = 'custom-provider';
 *
 *   async generate(options: BaseGenerationOptions): Promise<LLMResponse> {
 *     // Implementation for basic generation
 *   }
 *
 *   async generateWithRetry(options: RetryGenerationOptions): Promise<LLMResponse> {
 *     // Implementation with retry logic
 *   }
 *
 *   // ... implement all other abstract methods
 * }
 * ```
 */
export abstract class LLMProvider {
  /**
   * The provider name (e.g. openai, anthropic)
   */
  abstract readonly name: string;

  /**
   * Generates a response from the LLM based on the provided messages.
   *
   * This is the core generation method that all providers must implement.
   * It should handle the basic request/response cycle without any retry
   * or validation logic. For production use, consider implementing
   * generateWithRetry or generateAndValidateWithRetry methods.
   *
   * @param options - Generation options containing messages and parameters
   * @param options.messages - Array of messages to send to the LLM
   * @param options.temperature - Optional temperature controlling randomness (0-1)
   * @param options.maxTokens - Optional maximum number of tokens to generate
   * @param options.model - Optional model to use for this request, overriding the provider's default model
   * @returns Promise resolving to an LLMResponse containing the generated content and metadata
   * @throws Error if the generation fails due to API errors, invalid parameters, or network issues
   */
  abstract generate(options: BaseGenerationOptions): Promise<LLMResponse>;

  /**
   * Generates a response from the LLM with retry logic.
   *
   * This method should implement retry logic for handling transient failures
   * such as network errors, rate limiting, or temporary service unavailability.
   * It should use the basic generate method internally and add retry behavior
   * around it.
   *
   * @param options - Generation options with retry configuration
   * @param options.messages - Array of messages to send to the LLM
   * @param options.temperature - Optional temperature controlling randomness (0-1)
   * @param options.maxTokens - Optional maximum number of tokens to generate
   * @param options.model - Optional model to use for this request, overriding the provider's default model
   * @param options.maxAttempts - Optional maximum number of attempts to make before giving up (default: 3)
   * @param options.defaultWaitTime - Optional time to wait between attempts if parsing the response timeout info fails (default: 0)
   * @returns Promise resolving to an LLMResponse
   * @throws Error if all retry attempts fail
   */
  abstract generateWithRetry(options: RetryGenerationOptions): Promise<LLMResponse>;

  /**
   * Generates a validated response from the LLM, with retry logic for both network and validation errors.
   *
   * This method combines network retry logic with response validation and parsing.
   * It should attempt to parse and validate the response according to the provided
   * contract, retrying on both network failures and validation failures.
   *
   * @param options - Generation options with validation configuration
   * @param options.messages - Array of messages to send to the LLM
   * @param options.temperature - Optional temperature controlling randomness (0-1)
   * @param options.maxTokens - Optional maximum number of tokens to generate
   * @param options.model - Optional model to use for this request, overriding the provider's default model
   * @param options.responseContract - Contract to validate the response against
   * @param options.validationAttempts - Number of validation attempts (default: 3). Doesn't account for retries related to network errors.
   * @returns Promise resolving to a ParsedLLMResponse with both raw and parsed data
   * @throws Error if all validation attempts fail after exhausting retry logic
   */
  abstract generateAndValidateWithRetry<TType>(
    options: ValidationGenerationOptions<TType>
  ): Promise<ParsedLLMResponse<TType>>;

  /**
   * Generates multiple responses from the LLM based on an array of input requests, with optional validation.
   *
   * This method should process multiple generation requests in parallel batches,
   * with support for both validated and non-validated responses. The method is
   * overloaded to handle both cases based on the options provided.
   *
   * @param options - Parallel generation options with optional validation
   * @param options.inputs - Array of generation input parameters
   * @param options.parallelBatches - Optional maximum number of parallel batches to use (default: 3)
   * @param options.responseContract - Optional contract to validate the response against. If provided, the method will return parsed responses.
   * @param options.validationAttempts - Optional number of validation attempts per input (default: 3)
   * @returns A promise that resolves to an array of LLM responses (or parsed responses) in the same order as the inputs.
   * @throws Error if any input validation fails or if generation fails for any input
   */
  // Overload for validation
  abstract generateMultipleParallel<TType>(
    options: ParallelValidationGenerationOptions<TType>
  ): Promise<Array<ParsedLLMResponse<TType>>>;

  // Overload for no validation
  abstract generateMultipleParallel(options: ParallelGenerationOptions): Promise<Array<LLMResponse>>;

  /**
   * Implementation signature that concrete classes must implement.
   *
   * This is the actual implementation method that handles both validated
   * and non-validated parallel generation. Concrete classes should implement
   * this method to handle the logic for both overloads.
   *
   * @param options - Either ParallelGenerationOptions or ParallelValidationGenerationOptions
   * @returns Promise resolving to an array of LLM responses or parsed responses
   */
  // Implementation signature that concrete classes must implement
  abstract generateMultipleParallel<TType>(
    options: ParallelGenerationOptions | ParallelValidationGenerationOptions<TType>
  ): Promise<Array<LLMResponse | ParsedLLMResponse<TType>>>;

  /**
   * Generates multiple responses from the LLM by processing requests sequentially.
   *
   * This method should process each input request one after another, in sequence.
   * It provides network retry support but no validation. Useful when you need
   * to ensure requests are processed in order or when you want to avoid overwhelming
   * the LLM service with parallel requests.
   *
   * @param options - Parallel generation options
   * @param options.inputs - Array of generation input parameters
   * @returns Promise that resolves to an array of LLM responses in the same order as inputs
   * @throws Error if any individual generation fails
   */
  abstract generateMultipleSequential(options: ParallelGenerationOptions): Promise<Array<LLMResponse>>;
}
