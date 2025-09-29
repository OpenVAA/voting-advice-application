import { createOpenAI } from '@ai-sdk/openai';
import { generateObject, streamText } from 'ai';
import { calculateLLMCost, getModelPricing } from '../utils/costCalculation';
import type { LanguageModelUsage as TokenUsage, Provider, ToolSet } from 'ai';
import type {
  LLMObjectGenerationOptions,
  LLMObjectGenerationResult,
  LLMStreamOptions,
  LLMStreamResult,
  ProviderConfig
} from './provider.types';

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

  async generateObject<TType>(options: LLMObjectGenerationOptions<TType>): Promise<LLMObjectGenerationResult<TType>> {
    const startTime = performance.now();

    const result = await generateObject({
      model: this.provider.languageModel(options.modelConfig.primary),
      schema: options.schema,
      messages: options.messages ?? [],
      temperature: options.temperature,
      maxRetries: options.maxRetries ?? 3
    });

    const costs = this.calculateCosts(options.modelConfig.primary, result.usage);

    return {
      ...result,
      latencyMs: performance.now() - startTime,
      attempts: 1,
      costs,
      fallbackUsed: false
    };
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
      tools: options.tools
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
