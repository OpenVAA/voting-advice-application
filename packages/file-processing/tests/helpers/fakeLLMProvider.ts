import type { Controller } from '@openvaa/core';
import type { ToolSet } from 'ai';
import type {
  LLMModelConfig,
  LLMObjectGenerationOptions,
  LLMObjectGenerationResult,
  LLMStreamOptions,
  LLMStreamResult
} from '@openvaa/llm-refactor';

/**
 * Configuration for a fake LLM response
 */
export interface FakeLLMResponse<TType = unknown> {
  object: TType;
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
 * Configuration for a fake stream text response
 */
export interface FakeStreamResponse {
  text: string;
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
 * Interface matching LLMProvider for type-safe testing
 */
export interface TestLLMProvider {
  generateObject<TType>(options: LLMObjectGenerationOptions<TType>): Promise<LLMObjectGenerationResult<TType>>;
  generateObjectParallel<TType>(params: {
    requests: Array<LLMObjectGenerationOptions<TType>>;
    maxConcurrent?: number;
    controller?: Controller;
  }): Promise<Array<LLMObjectGenerationResult<TType>>>;
  streamText<TOOLS extends ToolSet | undefined = undefined>(options: LLMStreamOptions<TOOLS>): LLMStreamResult<TOOLS>;
  cumulativeCosts: number;
}

/**
 * Mock LLM Provider for testing
 * Allows you to configure responses for specific prompts or use a default response
 */
export class FakeLLMProvider implements TestLLMProvider {
  private responses: Map<string, FakeLLMResponse> = new Map();
  private defaultResponse: FakeLLMResponse | null = null;
  private streamResponses: Map<string, FakeStreamResponse> = new Map();
  private defaultStreamResponse: FakeStreamResponse | null = null;
  private callHistory: Array<LLMObjectGenerationOptions<unknown>> = [];
  private streamCallHistory: Array<LLMStreamOptions<ToolSet | undefined>> = [];
  public cumulativeCosts: number = 0;

  /**
   * Configure a response for a specific prompt pattern
   * @param promptPattern - A substring to match in the prompt
   * @param response - The response to return when the pattern matches
   */
  addResponse<TType>(promptPattern: string, response: FakeLLMResponse<TType>): void {
    this.responses.set(promptPattern, response as FakeLLMResponse);
  }

  /**
   * Set a default response for any prompt that doesn't match a pattern
   */
  setDefaultResponse<TType>(response: FakeLLMResponse<TType>): void {
    this.defaultResponse = response as FakeLLMResponse;
  }

  /**
   * Configure a stream response for a specific prompt pattern
   * @param promptPattern - A substring to match in the prompt
   * @param response - The response to return when the pattern matches
   */
  addStreamResponse(promptPattern: string, response: FakeStreamResponse): void {
    this.streamResponses.set(promptPattern, response);
  }

  /**
   * Set a default stream response for any prompt that doesn't match a pattern
   */
  setDefaultStreamResponse(response: FakeStreamResponse): void {
    this.defaultStreamResponse = response;
  }

  /**
   * Get the call history
   */
  getCallHistory(): Array<LLMObjectGenerationOptions<unknown>> {
    return this.callHistory;
  }

  /**
   * Get the stream call history
   */
  getStreamCallHistory(): Array<LLMStreamOptions<ToolSet | undefined>> {
    return this.streamCallHistory;
  }

  /**
   * Clear call history
   */
  clearHistory(): void {
    this.callHistory = [];
    this.streamCallHistory = [];
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
      reasoning: undefined,
      finishReason: 'stop' as const,
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
      providerMetadata: undefined,
      toJsonResponse: () =>
        new Response(JSON.stringify(response.object), {
          status: 200,
          headers: { 'content-type': 'application/json; charset=utf-8' }
        }),
      rawResponse: {
        headers: {}
      },
      latencyMs: response.latencyMs || 100,
      attempts: 1,
      costs,
      model: options.modelConfig.primary,
      fallbackUsed: false
    } as unknown as LLMObjectGenerationResult<TType>;
  }

  /**
   * Generate multiple objects in parallel (mocked)
   */
  async generateObjectParallel<TType>({
    requests,
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

  /**
   * Stream text from the fake LLM
   */
  streamText<TOOLS extends ToolSet | undefined = undefined>(options: LLMStreamOptions<TOOLS>): LLMStreamResult<TOOLS> {
    this.streamCallHistory.push(options);

    // Extract the prompt content from messages
    let promptContent = '';
    if (options.messages && options.messages.length > 0) {
      const firstMessage = options.messages[0];
      if (typeof firstMessage.content === 'string') {
        promptContent = firstMessage.content;
      } else if (Array.isArray(firstMessage.content)) {
        // Find text content in array
        const textContent = firstMessage.content.find((c) => c.type === 'text');
        if (textContent && 'text' in textContent) {
          promptContent = textContent.text;
        }
      }
    }

    // Find matching response
    let matchedResponse: FakeStreamResponse | null = null;
    for (const [pattern, response] of this.streamResponses.entries()) {
      if (promptContent.includes(pattern)) {
        matchedResponse = response;
        break;
      }
    }

    // Use default if no match found
    const response = matchedResponse || this.defaultStreamResponse;

    if (!response) {
      throw new Error('No stream response configured for this prompt pattern and no default stream response set');
    }

    const costs = response.costs || { input: 0.001, output: 0.002, total: 0.003 };
    this.cumulativeCosts += costs.total;

    // Create a mock stream result that matches the LLMStreamResult interface
    const result = {
      text: Promise.resolve(response.text),
      usage: Promise.resolve(
        response.usage || {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150
        }
      ),
      finishReason: Promise.resolve('stop' as const),
      latencyMs: response.latencyMs || 100,
      attempts: 1,
      costs: Promise.resolve(costs),
      fallbackUsed: false,
      // Additional properties from StreamTextResult
      textStream: (async function* () {
        yield response.text;
      })(),
      fullStream: (async function* () {
        yield { type: 'text-delta' as const, textDelta: response.text };
        yield {
          type: 'finish' as const,
          finishReason: 'stop' as const,
          usage: response.usage || { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
        };
      })(),
      warnings: undefined,
      rawResponse: { headers: {} },
      request: { body: JSON.stringify(options) },
      response: {
        id: 'fake-stream-response-id',
        timestamp: new Date(),
        modelId: options.modelConfig?.primary || 'fake-model'
      }
    };

    return result as unknown as LLMStreamResult<TOOLS>;
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
