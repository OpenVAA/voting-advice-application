import { isModelSupported, MODEL_PRICING } from '../modelPricing';
import type { LanguageModelUsage as TokenUsage } from 'ai';
import type { LLMCosts, ModelPricing } from './costCalculation.type';

/**
 * Get pricing information for a specific model
 * @param provider - The LLM provider (e.g., 'openai', 'anthropic')
 * @param model - The model name
 * @returns ModelPricing object or null if pricing is not found
 */
export function getModelPricing(provider: string, model: string): ModelPricing | null {
  if (!isModelSupported(provider, model)) {
    console.info('Pricing not found for provider "' + provider + '" and model "' + model + '"');
    return null;
  }

  return MODEL_PRICING[provider][model];
}

/**
 * Calculates the cost of an LLM call based on token usage and pricing information.
 * If cached input pricing is not provided, we fallback to the non-cached input pricing.
 * If reasoning pricing is not provided, reasoning tokens are priced at the output rate.
 *
 * Token semantics follow AI SDK 7's `LanguageModelUsage` (`node_modules/ai/dist/index.d.ts`): `outputTokens` is "the number of total output (completion) tokens", and `outputTokenDetails.{textTokens, reasoningTokens}` is its breakdown, so reasoning tokens are already inside `outputTokens` and must not be billed on top of it. Likewise `inputTokens` is the total input and `inputTokenDetails.cacheReadTokens` the cached part of it.
 *
 * @param pricing - The pricing information for the model (caller provides appropriate pricing)
 * @param usage - Token usage information. Cached input is read from `inputTokenDetails.cacheReadTokens` and reasoning from `outputTokenDetails.reasoningTokens`
 * @param useCachedInput - Whether to split the input into cached tokens (billed at `cachedInput`) and uncached tokens (billed at `input`). Without it, all input tokens are billed at `input`.
 * @returns Cost in USD. `reasoning` is the reasoning part of `output`, reported separately; `total` is `input + output`.
 *
 * @example
 * ```typescript
 * const cost = calculateLLMCost({
 *   pricing: { input: 0.00015, output: 0.0006, cachedInput: 0.0001 },
 *   usage: result.usage, // inputTokens, outputTokens, inputTokenDetails.cacheReadTokens, outputTokenDetails.reasoningTokens
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
  const inputTokens = usage.inputTokens ?? 0;
  const outputTokens = usage.outputTokens ?? 0;

  // Input. With cached input, the cached part is billed at the cached rate and the rest (inputTokens - cacheReadTokens) at the full input rate.
  let inputCost: number;
  if (useCachedInput) {
    const cachedTokens = Math.min(usage.inputTokenDetails?.cacheReadTokens ?? 0, inputTokens);
    const uncachedTokens = inputTokens - cachedTokens;
    inputCost =
      (uncachedTokens / 1_000_000) * pricing.input +
      (cachedTokens / 1_000_000) * (pricing.cachedInput ?? pricing.input);
  } else {
    inputCost = (inputTokens / 1_000_000) * pricing.input;
  }

  // Output. Reasoning tokens are a subset of outputTokens, so split them out and price each part once.
  const reasoningTokens = Math.min(usage.outputTokenDetails?.reasoningTokens ?? 0, outputTokens);
  const textTokens = outputTokens - reasoningTokens;
  const reasoningCost = (reasoningTokens / 1_000_000) * (pricing.reasoning ?? pricing.output);
  const outputCost = (textTokens / 1_000_000) * pricing.output + reasoningCost;

  return {
    input: inputCost,
    output: outputCost,
    reasoning: reasoningCost,
    total: inputCost + outputCost
  };
}
