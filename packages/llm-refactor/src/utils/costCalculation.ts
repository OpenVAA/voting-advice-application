import { isModelSupported, MODEL_PRICING } from '../modelPricing';
import type { LanguageModelUsage as TokenUsage } from 'ai';
import type { LLMCosts, ModelPricing } from './costCalculation.type';

/**
 * Error thrown when model pricing is not found
 */
export class ModelPricingNotFoundError extends Error {
  constructor(provider: string, model: string) {
    super(`Pricing not found for provider "${provider}" and model "${model}"`);
    this.name = 'ModelPricingNotFoundError';
  }
}

/**
 * Get pricing information for a specific model
 * @param provider - The LLM provider (e.g., 'openai', 'anthropic')
 * @param model - The model name
 * @returns ModelPricing object
 * @throws ModelPricingNotFoundError if pricing is not found
 */
export function getModelPricing(provider: string, model: string): ModelPricing {
  // TODO: don't throw, return null instead of sumthing
  if (!isModelSupported(provider, model)) {
    throw new ModelPricingNotFoundError(provider, model);
  }

  return MODEL_PRICING[provider][model];
}

/**
 * Calculates the cost of an LLM call based on token usage and pricing information.
 * If cached input pricing is not provided, we fallback to the non-cached input pricing.
 *
 * @param pricing - The pricing information for the model (caller provides appropriate pricing)
 * @param usage - Token usage information
 * @param useCachedInput - Whether to treat input tokens as cached (affects which token properties are used)
 * @returns Cost in USD
 *
 * @example
 * ```typescript
 * const cost = calculateLLMCost({
 *   pricing: { input: 0.00015, output: 0.0006, cachedInput: 0.0001, reasoning: 0 },
 *   usage: { inputTokens: 100000, outputTokens: 100000, reasoningTokens: 0 },
 *   useCachedInput: false
 * });
 * ```
 */
export function calculateLLMCost({
  pricing,
  usage,
  useCachedInput = false
}: {
  pricing: ModelPricing;
  usage: TokenUsage;
  useCachedInput?: boolean;
}): LLMCosts {
  const { inputTokens, outputTokens, reasoningTokens = 0, cachedInputTokens } = usage;

  let totalInputTokens: number;
  let inputPrice: number;

  if (useCachedInput) {
    // When using cached input, we look for cachedInputTokens
    totalInputTokens = cachedInputTokens ?? 0;
    inputPrice = pricing.cachedInput ?? pricing.input;
  } else {
    // For non-cached input, we use inputTokens
    totalInputTokens = inputTokens ?? 0;
    inputPrice = pricing.input;
  }

  // Output tokens are always treated as non-cached
  const totalOutputTokens = outputTokens ?? 0;

  // Calculate costs - ModelPricing should be configured with the appro whether the input is cached or not
  const inputCost = (totalInputTokens / 1_000_000) * inputPrice;
  const outputCost = (totalOutputTokens / 1_000_000) * pricing.output;
  const reasoningCost = pricing.reasoning && reasoningTokens ? (reasoningTokens / 1_000_000) * pricing.reasoning : 0;

  return {
    input: inputCost,
    output: outputCost,
    reasoning: reasoningCost,
    total: inputCost + outputCost + reasoningCost
  };
}
