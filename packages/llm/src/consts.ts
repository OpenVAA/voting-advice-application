/**
 * Provider-specific model pricing (per 1M tokens in USD)
 * Updated as of July 2025
 */
export const MODEL_PRICING = {
  openai: {
    // GPT-4.1 family
    'gpt-4.1': { input: 2.0, cachedInput: 0.5, output: 8.0 },
    'gpt-4.1-2025-04-14': { input: 2.0, cachedInput: 0.5, output: 8.0 },
    'gpt-4.1-mini': { input: 0.4, cachedInput: 0.1, output: 1.6 },
    'gpt-4.1-mini-2025-04-14': { input: 0.4, cachedInput: 0.1, output: 1.6 },
    'gpt-4.1-nano': { input: 0.1, cachedInput: 0.025, output: 0.4 },
    'gpt-4.1-nano-2025-04-14': { input: 0.1, cachedInput: 0.025, output: 0.4 },

    // GPT-4.5
    'gpt-4.5-preview': { input: 75.0, cachedInput: 37.5, output: 150.0 },
    'gpt-4.5-preview-2025-02-27': { input: 75.0, cachedInput: 37.5, output: 150.0 },

    // GPT-4o family
    'gpt-4o': { input: 5.0, cachedInput: 2.5, output: 20.0 },
    'gpt-4o-2024-08-06': { input: 2.5, cachedInput: 1.25, output: 10.0 },
    'gpt-4o-audio-preview': { input: 2.5, cachedInput: 0, output: 10.0 },
    'gpt-4o-audio-preview-2024-12-17': { input: 2.5, cachedInput: 0, output: 10.0 },
    'gpt-4o-realtime-preview': { input: 5.0, cachedInput: 2.5, output: 20.0 },
    'gpt-4o-realtime-preview-2025-06-03': { input: 5.0, cachedInput: 2.5, output: 20.0 },
    'gpt-4o-mini': { input: 0.15, cachedInput: 0.075, output: 0.6 },
    'gpt-4o-mini-2024-07-18': { input: 0.15, cachedInput: 0.075, output: 0.6 },
    'gpt-4o-mini-audio-preview': { input: 0.15, cachedInput: 0, output: 0.6 },
    'gpt-4o-mini-audio-preview-2024-12-17': { input: 0.15, cachedInput: 0, output: 0.6 },
    'gpt-4o-mini-realtime-preview': { input: 0.6, cachedInput: 0.3, output: 2.4 },
    'gpt-4o-mini-realtime-preview-2024-12-17': { input: 0.6, cachedInput: 0.3, output: 2.4 },

    // o1 family
    o1: { input: 15.0, cachedInput: 7.5, output: 60.0 },
    'o1-2024-12-17': { input: 15.0, cachedInput: 7.5, output: 60.0 },
    'o1-pro': { input: 150.0, cachedInput: 0, output: 600.0 },
    'o1-pro-2025-03-19': { input: 150.0, cachedInput: 0, output: 600.0 },
    'o1-mini': { input: 1.1, cachedInput: 0.55, output: 4.4 },
    'o1-mini-2024-09-12': { input: 1.1, cachedInput: 0.55, output: 4.4 },

    // o3 family
    'o3-pro': { input: 20.0, cachedInput: 0, output: 80.0 },
    'o3-pro-2025-06-10': { input: 20.0, cachedInput: 0, output: 80.0 },
    o3: { input: 2.0, cachedInput: 0.5, output: 8.0 },
    'o3-2025-04-16': { input: 2.0, cachedInput: 0.5, output: 8.0 },
    'o3-deep-research': { input: 10.0, cachedInput: 2.5, output: 40.0 },
    'o3-deep-research-2025-06-26': { input: 10.0, cachedInput: 2.5, output: 40.0 },
    'o3-mini': { input: 1.1, cachedInput: 0.55, output: 4.4 },
    'o3-mini-2025-01-31': { input: 1.1, cachedInput: 0.55, output: 4.4 },

    // o4 family
    'o4-mini': { input: 1.1, cachedInput: 0.275, output: 4.4 },
    'o4-mini-2025-04-16': { input: 1.1, cachedInput: 0.275, output: 4.4 },
    'o4-mini-deep-research': { input: 2.0, cachedInput: 0.5, output: 8.0 },
    'o4-mini-deep-research-2025-06-26': { input: 2.0, cachedInput: 0.5, output: 8.0 }
  }
  // Add other providers here in the future
  // anthropic: { ... },
  // azure: { ... }
} as const;
