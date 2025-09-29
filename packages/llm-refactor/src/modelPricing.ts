import type { ModelPricing } from './utils/costCalculation.type';

export const MODEL_PRICING: Record<string, Record<string, ModelPricing>> = {
  openai: {
    'gpt-4o-mini': { input: 0.15, cachedInput: 0.075, output: 0.6 },
    'gpt-4o': { input: 0.5, cachedInput: 0.25, output: 2.0 }
  }
};

/**
 * Check if a provider is supported
 */
export function isProviderSupported(provider: string): boolean {
  return provider in MODEL_PRICING;
}

/**
 * Check if a model is supported for a provider
 */
export function isModelSupported(provider: string, model: string): boolean {
  return isProviderSupported(provider) && model in MODEL_PRICING[provider];
}