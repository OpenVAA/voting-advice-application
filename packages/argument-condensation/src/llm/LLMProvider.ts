import { LLMResponse } from './types';

interface LLMProviderConfig {
  apiKey: string;
  model: string;
}

export class LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  async generate(prompt: string): Promise<LLMResponse> {
    // TODO: Implement actual OpenAI API call
    // This is a placeholder implementation
    return {
      content: '',
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      model: this.model,
    };
  }
}
