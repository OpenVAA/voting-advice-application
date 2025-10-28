export const FALLBACK_MODELS = {
  openai: {
    'gpt-4o-mini': 'gpt-4.1-mini',
    'gpt-4.1-mini': 'gpt-4o-mini',
    'gpt-4.1': 'gpt-4.1-mini',
    'gpt-5-mini': 'gpt-4.1-mini',
    'gpt-5': 'gpt-4.1-mini',
    'lastResort': 'gpt-4o-mini',
    'gpt-4.1-nano-2025-04-14': 'gpt-4.1-mini',
  },
  google: {
    'gemini-2.5-flash-preview-09-2025': 'gemini-2.5-pro',
    'gemini-2.5-pro': 'gemini-2.5-flash-preview-09-2025',
    'lastResort': 'gemini-2.5-flash-preview-09-2025',
  }
}

export function isSupportedProvider(provider: string): boolean {
  return provider in FALLBACK_MODELS;
}

export function isSupportedModel(provider: string, model: string): boolean {
  return isSupportedProvider(provider) && model in FALLBACK_MODELS[provider as keyof typeof FALLBACK_MODELS];
}

export function getFallbackModel(provider: string, model: string): string {

  // If the model has been manually assigned a fallback model, use it
  if (isSupportedModel(provider, model)) {
    return model;
  }

  // No fallback model found for this model, check if the default fallback model is different from the original model
  if (FALLBACK_MODELS[provider as keyof typeof FALLBACK_MODELS]['lastResort'] !== model) {
    return FALLBACK_MODELS[provider as keyof typeof FALLBACK_MODELS]['lastResort'];
  }

  // Use any model as fallback, because the configured fallback safety net failed
  return Object.keys(FALLBACK_MODELS[provider as keyof typeof FALLBACK_MODELS]).find((mdel) => mdel !== model) as string;
}