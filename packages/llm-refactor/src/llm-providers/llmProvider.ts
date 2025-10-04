import { createOpenAI } from '@ai-sdk/openai';
import { generateObject, NoObjectGeneratedError, streamText } from 'ai';
import { calculateLLMCost, getModelPricing } from '../utils/costCalculation';
import type { Controller } from '@openvaa/core';
import type { LanguageModelUsage as TokenUsage, Provider, ToolSet } from 'ai';
import type {
  LLMObjectGenerationOptions,
  LLMObjectGenerationResult,
  LLMStreamOptions,
  LLMStreamResult,
  ProviderConfig
} from './provider.types';

/** Orchestrates LLM calls with cost calculation, latency tracking, error handling and validation retries */
export class LLMProvider {
  private provider: Provider;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.provider = this.initProvider(config);
  }

  private initProvider(config: ProviderConfig): Provider {
    switch (config.provider) {
      case 'openai':
        return createOpenAI({ apiKey: config.apiKey });
      // Add other providers as needed and update the provider config to support them
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Generate an object from the LLM
   * @param options - The options for the generate object
   * @returns The generate object result
   *
   * @example
   * ```typescript
   * const result = llmProvider.generateObject({
   *   modelConfig: { primary: 'gpt-4o-mini' },
   *   schema: z.object({ name: z.string() }),
   *   messages: [{ role: 'user', content: 'What is the capital of France?' }]
   * });
   * ```
   */
  async generateObject<TType>(options: LLMObjectGenerationOptions<TType>): Promise<LLMObjectGenerationResult<TType>> {
    const startTime = performance.now();
    const validationRetries = options.validationRetries ?? 1;
    let lastError: unknown; // Throw this if all validation retries fail

    // Loop through validation retries
    for (let attempt = 1; attempt <= validationRetries; attempt++) {
      try {
        // Check if an abort has been requested. Throws AbortError if so.
        options.controller?.checkAbort();

        // Generation call which throws on validation failures
        const result = await generateObject({
          model: this.provider.languageModel(options.modelConfig.primary),
          schema: options.schema,
          messages: options.messages ?? [],
          temperature: options.temperature,
          maxRetries: options.maxRetries ?? 3 // Retries for network errors
        });

        const costs = this.calculateCosts(options.modelConfig.primary, result.usage);

        return {
          ...result,
          latencyMs: performance.now() - startTime,
          attempts: attempt,
          costs,
          fallbackUsed: false
        };
      } catch (error) {
        lastError = error;

        // Retry on validation failure
        if (NoObjectGeneratedError.isInstance(error)) {
          if (attempt < validationRetries) {
            continue; // Try again
          }
        } else {
          // For other errors (e.g. network, auth), throw immediately. TODO: Handle these errors better.
          throw error;
        }
      }
    }

    // If all validation retries fail, throw an error
    throw new Error(
      `Failed to generate object after ${validationRetries} validation attempts. Last error: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    );
  }
  /** Generate multiple objects in parallel with validation retries. 
   *  Requests are processed in batches of maxConcurrent. Batches are processed in order sequentially,
   *  so each batch is as slow as the slowest request in the batch.
   * @param requests - The requests to make
   * @param maxConcurrent - The maximum number of concurrent requests to make
   * @returns The generated objects
   *
   * @example
   * ```typescript
   * const results = await llmProvider.generateObjectParallel({ requests: [{ modelConfig: { primary: 'gpt-4o-mini' }, schema: z.object({ name: z.string() }), messages: [{ role: 'user', content: 'What is the capital of France?' }] }], maxConcurrent: 5 });
   * ```
   */
  async generateObjectParallel<TType>({
    requests,
    maxConcurrent = 5,
    controller
  }: {
    requests: Array<LLMObjectGenerationOptions<TType>>;
    maxConcurrent?: number;
    controller?: Controller;
  }): Promise<Array<LLMObjectGenerationResult<TType>>> {
    // Handle empty input
    if (requests.length === 0) {
      return [];
    }

    const results: Array<LLMObjectGenerationResult<TType>> = [];
    const totalBatches = Math.ceil(requests.length / maxConcurrent);
    let completedBatches = 0;

    for (let i = 0; i < requests.length; i += maxConcurrent) {
      // Take a batch of requests (up to maxConcurrent)
      const batch = requests.slice(i, i + maxConcurrent);

      // Check if an abort has been requested. Throws AbortError if so.
      controller?.checkAbort();

      // Update progress after each batch completes
      completedBatches++;
      if (controller) {
        controller.progress(completedBatches / totalBatches);
      }

      // Process the batch in parallel
      const batchResults = await Promise.all(batch.map((request) => this.generateObject(request)));
      results.push(...batchResults);
    }

    // Check if an abort has been requested. Throws AbortError if so.
    controller?.checkAbort();

    return results;
  }

  /**
   * Stream text from the LLM
   * @param options - The options for the stream text
   * @returns The stream text result
   *
   * @example
   * ```typescript
   * const result = llmProvider.streamText({
   *   modelConfig: {
   *     primary: 'gpt-4o-mini'
   *   },
   *   messages: [{ role: 'user', content: 'What's yar favorite meal?' }]
   * });
   * ```
   */
  streamText<TOOLS extends ToolSet | undefined = undefined>(options: LLMStreamOptions<TOOLS>): LLMStreamResult<TOOLS> {
    const startTime = performance.now();

    const result = streamText({
      model: this.provider.languageModel(options.modelConfig?.primary ?? ''),
      messages: options.messages ?? [],
      temperature: options.temperature,
      tools: options.tools,
      stopWhen: options.stopWhen
    });

    // Calculate costs asynchronously without blocking the return.
    const costs = result.usage.then((usage) => this.calculateCosts(options.modelConfig?.primary ?? '', usage));

    const enhancedResult = Object.assign(result, {
      latencyMs: performance.now() - startTime,
      attempts: 1,
      costs,
      fallbackUsed: false
    });

    return enhancedResult as unknown as LLMStreamResult<TOOLS>;
  }

  private calculateCosts(model: string, usage: TokenUsage) {
    const pricing = getModelPricing(this.config.provider, model);
    return calculateLLMCost({
      pricing,
      usage: usage,
      useCachedInput: this.config.modelConfig.useCachedInput
    });
  }
}
