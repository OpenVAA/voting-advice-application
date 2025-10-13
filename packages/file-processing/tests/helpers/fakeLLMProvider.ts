import type { LLMModelConfig, LLMObjectGenerationOptions, LLMObjectGenerationResult } from '@openvaa/llm-refactor';
import type { Controller } from '@openvaa/core';

/**
 * Configuration for a fake LLM response
 */
export interface FakeLLMResponse<T = unknown> {
  object: T;
  latencyMs?: number;
  costs?: {
    input: number;
    output: number;
    total: number;
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Mock LLM Provider for testing
 * Allows you to configure responses for specific prompts or use a default response
 */
export class FakeLLMProvider {
  private responses: Map<string, FakeLLMResponse> = new Map();
  private defaultResponse: FakeLLMResponse | null = null;
  private callHistory: Array<LLMObjectGenerationOptions<unknown>> = [];
  public cumulativeCosts: number = 0;

  /**
   * Configure a response for a specific prompt pattern
   * @param promptPattern - A substring to match in the prompt
   * @param response - The response to return when the pattern matches
   */
  addResponse<T>(promptPattern: string, response: FakeLLMResponse<T>): void {
    this.responses.set(promptPattern, response as FakeLLMResponse);
  }

  /**
   * Set a default response for any prompt that doesn't match a pattern
   */
  setDefaultResponse<T>(response: FakeLLMResponse<T>): void {
    this.defaultResponse = response as FakeLLMResponse;
  }

  /**
   * Get the call history
   */
  getCallHistory(): Array<LLMObjectGenerationOptions<unknown>> {
    return this.callHistory;
  }

  /**
   * Clear call history
   */
  clearHistory(): void {
    this.callHistory = [];
    this.cumulativeCosts = 0;
  }

  /**
   * Generate an object from the fake LLM
   */
  async generateObject<TType>(options: LLMObjectGenerationOptions<TType>): Promise<LLMObjectGenerationResult<TType>> {
    this.callHistory.push(options as LLMObjectGenerationOptions<unknown>);

    // Extract the prompt content from messages
    const promptContent = options.messages?.[0]?.content || '';

    // Find matching response
    let matchedResponse: FakeLLMResponse | null = null;
    for (const [pattern, response] of this.responses.entries()) {
      if (typeof promptContent === 'string' && promptContent.includes(pattern)) {
        matchedResponse = response;
        break;
      }
    }

    // Use default if no match found
    const response = matchedResponse || this.defaultResponse;

    if (!response) {
      throw new Error('No response configured for this prompt pattern and no default response set');
    }

    const costs = response.costs || { input: 0.001, output: 0.002, total: 0.003 };
    this.cumulativeCosts += costs.total;

    return {
      object: response.object as TType,
      finishReason: 'stop',
      usage: response.usage || {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150
      },
      warnings: undefined,
      request: {
        body: JSON.stringify(options)
      },
      response: {
        id: 'fake-response-id',
        timestamp: new Date(),
        modelId: options.modelConfig.primary
      },
      rawResponse: {
        headers: {}
      },
      latencyMs: response.latencyMs || 100,
      attempts: 1,
      costs,
      model: options.modelConfig.primary,
      fallbackUsed: false
    } as LLMObjectGenerationResult<TType>;
  }

  /**
   * Generate multiple objects in parallel (mocked)
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
    const results: Array<LLMObjectGenerationResult<TType>> = [];

    for (const request of requests) {
      controller?.checkAbort?.();
      const result = await this.generateObject(request);
      results.push(result);
    }

    return results;
  }
}

/**
 * Create a fake LLM provider with common test configurations
 */
export function createFakeLLMProvider(): FakeLLMProvider {
  return new FakeLLMProvider();
}

/**
 * Create a fake model config for testing
 */
export function createFakeModelConfig(overrides?: Partial<LLMModelConfig>): LLMModelConfig {
  return {
    primary: 'fake-model-v1',
    ...overrides
  };
}
