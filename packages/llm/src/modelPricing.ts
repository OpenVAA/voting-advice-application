import type { ModelPricing } from './utils/costCalculation.type';

/** Pricing per million tokens in USD
 * 
 * @example
 * ```typescript
 * const pricing = MODEL_PRICING.openai['gpt-4o-mini'];
 * console.log(pricing); // { input: 0.15, cachedInput: 0.075, output: 0.6 }
 * ```
 */
export const MODEL_PRICING: Record<string, Record<string, ModelPricing>> = {
  openai: {
    'gpt-4o-mini': { input: 0.15, cachedInput: 0.075, output: 0.6 },
    'gpt-4.1-mini': { input: 0.4, cachedInput: 0.1, output: 1.6 },
    'gpt-4.1': { input: 2.0, cachedInput: 0.5, output: 8.0 },
    'gpt-5-mini': { input: 0.25, cachedInput: 0.025, output: 2.0 },
    'gpt-4o': { input: 2.5, cachedInput: 1.25, output: 10.0 },
    'gpt-5-nano': { input: 0.05, cachedInput: 0.005, output: 0.40 }
  },
  google: {
    'gemini-2.5-flash-preview-09-2025': { input: 0.3, output: 2.5, cachedInput: 0.0 }, // NaN cached input
    'gemini-2.5-pro': { input: 1.25, output: 10.0, cachedInput: 0.0 }
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