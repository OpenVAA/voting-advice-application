import { BaseController } from '@openvaa/core';
import { MODEL_PRICING } from '../consts';
import type { Controller } from '@openvaa/core';
import type { LLMProvider } from '../llm-providers/llm-provider';
import type { ModelPricing, TokenUsage } from '../types';

/**
 * Calculates the cost of an LLM call based on provider, model, and token usage
 *
 * @param provider - The LLM provider instance or provider name string
 * @param model - The model name (e.g., "gpt-4o-mini")
 * @param usage - Token usage information
 * @param useCachedInput - Whether input tokens should be treated as cached (optional)
 * @param controller - Optional controller for warning messages about unknown models
 * @returns Cost in USD, or 0 if provider is not supported or model not found
 */
export function calculateLLMCost({
  provider,
  model,
  usage,
  useCachedInput = false,
  controller = new BaseController()
}: {
  provider: LLMProvider | string;
  model: string;
  usage: TokenUsage;
  useCachedInput?: boolean;
  controller: Controller;
}): number {
  // Extract provider name from provider instance or use string directly
  const name = typeof provider === 'string' ? provider : provider.name;

  // Look up provider pricing
  const providerPricing = MODEL_PRICING[name as keyof typeof MODEL_PRICING];
  if (!providerPricing) {
    controller.warning(`Unsupported provider "${name}" - cost calculation returning 0`);
    return 0;
  }

  // Look up model pricing
  const pricing = (providerPricing as Record<string, ModelPricing>)[model];
  if (!pricing) {
    controller.warning(`Unknown model "${model}" for provider "${name}" - cost calculation returning 0`);
    return 0;
  }

  // Calculate cost based on token usage
  // Prices are per 1M tokens, so divide by 1,000,000
  const inputCostPerToken = useCachedInput ? pricing.cachedInput : pricing.input;
  const inputCost = (usage.promptTokens / 1_000_000) * inputCostPerToken;
  const outputCost = (usage.completionTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Gets the pricing information for a specific model and provider
 *
 * @param provider - The LLM provider instance or provider name string
 * @param model - The model name
 * @returns ModelPricing object if found, null otherwise
 */
export function getModelPricing(provider: LLMProvider | string, model: string): ModelPricing | null {
  const name = typeof provider === 'string' ? provider : provider.name;

  const providerPricing = MODEL_PRICING[name as keyof typeof MODEL_PRICING];
  if (!providerPricing) {
    return null;
  }

  return (providerPricing as Record<string, ModelPricing>)[model] || null;
}

/**
 * Lists all supported models for cost calculation
 *
 * @param provider - The LLM provider instance or provider name string
 * @returns Array of supported model names
 */
export function getSupportedModels(provider: LLMProvider | string): Array<string> {
  const name = typeof provider === 'string' ? provider : provider.name;

  const providerPricing = MODEL_PRICING[name as keyof typeof MODEL_PRICING];
  if (!providerPricing) {
    return [];
  }

  return Object.keys(providerPricing);
}

/**
 * Lists all supported providers for cost calculation
 *
 * @returns Array of supported provider names
 */
export function getSupportedProviders(): Array<string> {
  return Object.keys(MODEL_PRICING);
}
