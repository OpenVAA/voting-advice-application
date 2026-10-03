// Import mocked functions
import { createGoogle } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject, NoObjectGeneratedError as MockNoObjectGeneratedError, streamText } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { LLMProvider } from '../src/llm-providers/llmProvider';
import { calculateLLMCost, getModelPricing } from '../src/utils/costCalculation';
import type { AsyncIterableStream, LanguageModelUsage, StreamTextResult, ToolSet } from 'ai';
import type { ProviderConfig } from '../src/llm-providers/provider.types';

// Mock the AI SDK
vi.mock('ai', async () => {
  const actual = await vi.importActual('ai');
  return {
    ...actual,
    generateObject: vi.fn(),
    streamText: vi.fn(),
    NoObjectGeneratedError: {
      isInstance: vi.fn()
    },
    AsyncIterableStream: {
      fromReadableStream: vi.fn((stream) => stream)
    } as any // eslint-disable-line @typescript-eslint/no-explicit-any
  };
});

// Mock the OpenAI provider
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => ({
    languageModel: vi.fn((modelName: string) => ({
      modelName,
      provider: 'openai'
    }))
  }))
}));

// Mock the Google provider
vi.mock('@ai-sdk/google', () => ({
  createGoogle: vi.fn(() => ({
    languageModel: vi.fn((modelName: string) => ({
      modelName,
      provider: 'google'
    }))
  }))
}));

// Mock cost calculation utilities
vi.mock('../src/utils/costCalculation', () => ({
  calculateLLMCost: vi.fn(() => ({
    input: 0.001,
    output: 0.002,
    reasoning: 0,
    total: 0.003
  })),
  getModelPricing: vi.fn(() => ({
    input: 0.00015,
    output: 0.0006,
    cachedInput: 0.0001
  }))
}));

const mockGenerateObject = vi.mocked(generateObject);
const mockStreamText = vi.mocked(streamText);
const mockCreateOpenAI = vi.mocked(createOpenAI);
const mockCreateGoogle = vi.mocked(createGoogle);
const mockCalculateLLMCost = vi.mocked(calculateLLMCost);
const mockGetModelPricing = vi.mocked(getModelPricing);
const mockNoObjectGeneratedErrorIsInstance = vi.mocked(MockNoObjectGeneratedError.isInstance);

// A complete token usage record in the shape the AI SDK reports
function makeUsage(inputTokens: number, outputTokens: number): LanguageModelUsage {
  return {
    inputTokens,
    inputTokenDetails: { noCacheTokens: inputTokens, cacheReadTokens: 0, cacheWriteTokens: 0 },
    outputTokens,
    outputTokenDetails: { textTokens: outputTokens, reasoningTokens: 0 },
    totalTokens: inputTokens + outputTokens
  };
}

// Helper function to create mock text streams
function createMockTextStream(chunks: Array<string>): AsyncIterableStream<string> {
  const readableStream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    }
  });
  return readableStream as AsyncIterableStream<string>;
}

describe('LLMProvider', () => {
  let provider: LLMProvider;
  let mockProviderConfig: ProviderConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    mockProviderConfig = {
      provider: 'openai',
      apiKey: 'test-api-key',
      modelConfig: {
        primary: 'gpt-4o-mini',
        useCachedInput: false
      }
    };

    // Setup default mocks
    mockCreateOpenAI.mockReturnValue({
      languageModel: vi.fn((modelName: string) => ({
        modelName,
        provider: 'openai'
      }))
    } as unknown as ReturnType<typeof createOpenAI>);

    mockGetModelPricing.mockReturnValue({
      input: 0.00015,
      output: 0.0006,
      cachedInput: 0.0001
    });

    mockCalculateLLMCost.mockReturnValue({
      input: 0.001,
      output: 0.002,
      reasoning: 0,
      total: 0.003
    });
  });

  describe('constructor', () => {
    it('should create an instance with valid OpenAI config', () => {
      expect(() => {
        provider = new LLMProvider(mockProviderConfig);
      }).not.toThrow();

      expect(mockCreateOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key'
      });
    });

    it('should create an instance with valid Google config', () => {
      provider = new LLMProvider({ ...mockProviderConfig, provider: 'google' });

      expect(mockCreateGoogle).toHaveBeenCalledWith({
        apiKey: 'test-api-key'
      });
      expect(mockCreateOpenAI).not.toHaveBeenCalled();
    });

    it('should throw error for unsupported provider', () => {
      const invalidConfig = {
        ...mockProviderConfig,
        provider: 'unsupported' as 'openai'
      };

      expect(() => {
        new LLMProvider(invalidConfig);
      }).toThrow('Unsupported provider: unsupported');
    });
  });

  describe('generateObject', () => {
    beforeEach(() => {
      provider = new LLMProvider(mockProviderConfig);
    });

    it('should successfully generate object on first attempt', async () => {
      const mockResult = {
        object: { name: 'Test', value: 42 },
        usage: makeUsage(100, 50),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      };

      mockGenerateObject.mockResolvedValueOnce(mockResult);

      const schema = z.object({
        name: z.string(),
        value: z.number()
      });

      const options = {
        modelConfig: { primary: 'gpt-4o-mini' },
        schema,
        messages: [{ role: 'user' as const, content: 'Generate test data' }]
      };

      const result = await provider.generateObject(options);

      expect(mockGenerateObject).toHaveBeenCalledWith({
        model: expect.objectContaining({ modelName: 'gpt-4o-mini' }),
        schema,
        messages: options.messages,
        allowSystemInMessages: false,
        temperature: undefined,
        maxRetries: 3
      });

      expect(result).toEqual({
        ...mockResult,
        latencyMs: expect.any(Number),
        attempts: 1,
        costs: {
          input: 0.001,
          output: 0.002,
          reasoning: 0,
          total: 0.003
        },
        model: 'gpt-4o-mini',
        fallbackUsed: false
      });

      expect(result.latencyMs).toBeGreaterThan(0);
    });

    it('should pass through temperature and maxRetries options', async () => {
      const mockResult = {
        object: { name: 'Test' },
        usage: makeUsage(100, 50),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      };

      mockGenerateObject.mockResolvedValueOnce(mockResult);

      const options = {
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ name: z.string() }),
        messages: [{ role: 'user' as const, content: 'Test' }],
        temperature: 0.7,
        maxRetries: 5
      };

      await provider.generateObject(options);

      expect(mockGenerateObject).toHaveBeenCalledWith({
        model: expect.anything(),
        schema: options.schema,
        messages: options.messages,
        allowSystemInMessages: false,
        temperature: 0.7,
        maxRetries: 5
      });
    });

    it('should keep the SDK default and reject system messages unless the caller opts in', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: { name: 'Test' },
        usage: makeUsage(100, 50),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as never,
        response: {} as never,
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      });

      const messages = [{ role: 'system' as const, content: 'Condense these arguments.' }];
      await provider.generateObject({
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ name: z.string() }),
        messages
      });

      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({ messages, allowSystemInMessages: false })
      );
    });

    it('should forward an explicit allowSystemInMessages opt-in from the caller', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: { name: 'Test' },
        usage: makeUsage(100, 50),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as never,
        response: {} as never,
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      });

      const messages = [{ role: 'system' as const, content: 'Condense these arguments.' }];
      const result = await provider.generateObject({
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ name: z.string() }),
        messages,
        allowSystemInMessages: true
      });

      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({ messages, allowSystemInMessages: true })
      );
      expect(result.object).toEqual({ name: 'Test' });
    });

    it('should forward instructions to the SDK alongside the messages', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: { name: 'Test' },
        usage: makeUsage(100, 50),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as never,
        response: {} as never,
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      });

      const messages = [{ role: 'user' as const, content: 'The comments to condense.' }];
      await provider.generateObject({
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ name: z.string() }),
        instructions: 'Condense these arguments.',
        messages
      });

      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          instructions: 'Condense these arguments.',
          messages,
          allowSystemInMessages: false
        })
      );
    });

    it('should forward the deprecated system option as instructions', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: { name: 'Test' },
        usage: makeUsage(100, 50),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as never,
        response: {} as never,
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      });

      await provider.generateObject({
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ name: z.string() }),
        system: 'Condense these arguments.',
        messages: [{ role: 'user' as const, content: 'The comments to condense.' }]
      });

      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({ instructions: 'Condense these arguments.' })
      );
    });

    it('should forward the prompt form instead of replacing it with an empty message list', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: { name: 'Test' },
        usage: makeUsage(100, 50),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as never,
        response: {} as never,
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      });

      await provider.generateObject({
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ name: z.string() }),
        instructions: 'Answer briefly.',
        prompt: 'What is the capital of France?'
      });

      const [call] = mockGenerateObject.mock.calls[0];
      expect(call).toMatchObject({ instructions: 'Answer briefly.', prompt: 'What is the capital of France?' });
      expect(call).not.toHaveProperty('messages');
    });

    it('should retry on validation failures up to validationRetries limit', async () => {
      const validationError = new Error('Validation failed');
      mockNoObjectGeneratedErrorIsInstance.mockReturnValue(true);

      // First two attempts fail with validation error
      mockGenerateObject
        .mockRejectedValueOnce(validationError)
        .mockRejectedValueOnce(validationError)
        .mockResolvedValueOnce({
          object: { name: 'Success' },
          usage: makeUsage(100, 50),
          finishReason: 'stop' as const,
          reasoning: undefined,
          warnings: undefined,
          request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          providerMetadata: undefined,
          toJsonResponse: vi.fn()
        });

      const options = {
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ name: z.string() }),
        messages: [{ role: 'user' as const, content: 'Test' }],
        validationRetries: 3
      };

      const result = await provider.generateObject(options);

      expect(mockGenerateObject).toHaveBeenCalledTimes(3);
      expect(result.attempts).toBe(3);
      expect(result.object.name).toBe('Success');
    });

    it('should throw error when all validation retries are exhausted', async () => {
      const validationError = new Error('Validation failed');
      mockNoObjectGeneratedErrorIsInstance.mockReturnValue(true);

      mockGenerateObject.mockRejectedValueOnce(validationError).mockRejectedValueOnce(validationError);

      const options = {
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ name: z.string() }),
        messages: [{ role: 'user' as const, content: 'Test' }],
        validationRetries: 2
      };

      await expect(provider.generateObject(options)).rejects.toThrow(
        'Failed to generate object after 2 validation attempts. Last error: Validation failed'
      );

      expect(mockGenerateObject).toHaveBeenCalledTimes(2);
    });

    it('should immediately throw non-validation errors', async () => {
      const networkError = new Error('Network error');
      mockNoObjectGeneratedErrorIsInstance.mockReturnValue(false);

      mockGenerateObject.mockRejectedValueOnce(networkError);

      const options = {
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ name: z.string() }),
        messages: [{ role: 'user' as const, content: 'Test' }],
        validationRetries: 3
      };

      await expect(provider.generateObject(options)).rejects.toThrow('Network error');

      expect(mockGenerateObject).toHaveBeenCalledTimes(1);
    });

    it('should default validationRetries to 1 when not specified', async () => {
      const validationError = new Error('Validation failed');
      mockNoObjectGeneratedErrorIsInstance.mockReturnValue(true);

      mockGenerateObject.mockRejectedValueOnce(validationError);

      const options = {
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ name: z.string() }),
        messages: [{ role: 'user' as const, content: 'Test' }]
      };

      await expect(provider.generateObject(options)).rejects.toThrow(
        'Failed to generate object after 1 validation attempts'
      );

      expect(mockGenerateObject).toHaveBeenCalledTimes(1);
    });

    it('should calculate costs correctly', async () => {
      const mockResult = {
        object: { name: 'Test' },
        usage: makeUsage(1000, 500),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      };

      mockGenerateObject.mockResolvedValueOnce(mockResult);

      const options = {
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ name: z.string() }),
        messages: [{ role: 'user' as const, content: 'Test' }]
      };

      await provider.generateObject(options);

      expect(mockGetModelPricing).toHaveBeenCalledWith('openai', 'gpt-4o-mini');
      expect(mockCalculateLLMCost).toHaveBeenCalledWith({
        pricing: {
          input: 0.00015,
          output: 0.0006,
          cachedInput: 0.0001
        },
        usage: mockResult.usage,
        useCachedInput: false
      });
    });

    it('should handle cached input configuration', async () => {
      const configWithCachedInput = {
        ...mockProviderConfig,
        modelConfig: {
          ...mockProviderConfig.modelConfig,
          useCachedInput: true
        }
      };

      provider = new LLMProvider(configWithCachedInput);

      const mockResult = {
        object: { name: 'Test' },
        usage: makeUsage(100, 50),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      };

      mockGenerateObject.mockResolvedValueOnce(mockResult);

      const options = {
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ name: z.string() }),
        messages: [{ role: 'user' as const, content: 'Test' }]
      };

      await provider.generateObject(options);

      expect(mockCalculateLLMCost).toHaveBeenCalledWith({
        pricing: expect.any(Object),
        usage: mockResult.usage,
        useCachedInput: true
      });
    });
  });

  describe('streamText', () => {
    beforeEach(() => {
      provider = new LLMProvider(mockProviderConfig);
    });

    it('should pass system instructions as the instructions option', () => {
      // Only `usage` is read by the provider before it returns the result
      const minimalStreamResult = { usage: Promise.resolve(makeUsage(10, 5)) } as unknown as ReturnType<
        typeof streamText
      >;
      mockStreamText.mockReturnValueOnce(minimalStreamResult);
      mockStreamText.mockReturnValueOnce(minimalStreamResult);

      const messages = [{ role: 'user' as const, content: 'Hi' }];
      provider.streamText({ modelConfig: { primary: 'gpt-4o-mini' }, system: 'Be brief.', messages });
      provider.streamText({
        modelConfig: { primary: 'gpt-4o-mini' },
        system: 'Be brief.',
        instructions: 'Be very brief.',
        messages
      });

      expect(mockStreamText).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ instructions: 'Be brief.', messages })
      );
      expect(mockStreamText).toHaveBeenNthCalledWith(2, expect.objectContaining({ instructions: 'Be very brief.' }));
      expect(mockStreamText.mock.calls[0][0]).not.toHaveProperty('system');
    });

    it('should successfully stream text', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockStreamResult: StreamTextResult<any, any, any> = {
        textStream: createMockTextStream(['Hello', ' world']),
        usage: Promise.resolve(makeUsage(100, 50)),
        text: Promise.resolve('Hello world'),
        finishReason: Promise.resolve('stop' as const),
        content: Promise.resolve([]),
        reasoning: Promise.resolve([]),
        reasoningText: Promise.resolve(undefined),
        files: Promise.resolve([]),
        sources: Promise.resolve([]),
        toolCalls: Promise.resolve([]),
        staticToolCalls: Promise.resolve([]),
        dynamicToolCalls: Promise.resolve([]),
        staticToolResults: Promise.resolve([]),
        dynamicToolResults: Promise.resolve([]),
        toolResults: Promise.resolve([]),
        totalUsage: Promise.resolve(makeUsage(100, 50)),
        warnings: Promise.resolve(undefined),
        providerMetadata: Promise.resolve(undefined),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request: Promise.resolve({} as any),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response: Promise.resolve({} as any),
        steps: Promise.resolve([]),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fullStream: {} as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        experimental_partialOutputStream: {} as any,
        rawFinishReason: Promise.resolve(undefined),
        finalStep: Promise.resolve({} as never),
        responseMessages: Promise.resolve([]),
        stream: {} as never,
        partialOutputStream: {} as never,
        elementStream: {} as never,
        output: Promise.resolve(undefined),
        consumeStream: vi.fn(),
        toUIMessageStream: vi.fn(),
        pipeUIMessageStreamToResponse: vi.fn(),
        pipeTextStreamToResponse: vi.fn(),
        toUIMessageStreamResponse: vi.fn(),
        toTextStreamResponse: vi.fn()
      };

      mockStreamText.mockReturnValueOnce(mockStreamResult);

      const options = {
        modelConfig: { primary: 'gpt-4o-mini' },
        messages: [{ role: 'user' as const, content: 'Say hello' }]
      };

      const result = provider.streamText(options);

      expect(mockStreamText).toHaveBeenCalledWith({
        model: expect.objectContaining({ modelName: 'gpt-4o-mini' }),
        messages: options.messages,
        temperature: undefined,
        tools: undefined,
        stopWhen: undefined
      });

      expect(result).toEqual(
        expect.objectContaining({
          textStream: expect.any(Object),
          usage: expect.any(Promise),
          latencyMs: expect.any(Number),
          attempts: 1,
          costs: expect.any(Promise),
          fallbackUsed: false
        })
      );

      expect(result.latencyMs).toBeGreaterThan(0);
    });

    it('should pass through optional parameters', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockStreamResult: StreamTextResult<any, any, any> = {
        textStream: createMockTextStream(['test']),
        usage: Promise.resolve(makeUsage(100, 50)),
        text: Promise.resolve('test'),
        finishReason: Promise.resolve('stop' as const),
        content: Promise.resolve([]),
        reasoning: Promise.resolve([]),
        reasoningText: Promise.resolve(undefined),
        files: Promise.resolve([]),
        sources: Promise.resolve([]),
        toolCalls: Promise.resolve([]),
        staticToolCalls: Promise.resolve([]),
        dynamicToolCalls: Promise.resolve([]),
        staticToolResults: Promise.resolve([]),
        dynamicToolResults: Promise.resolve([]),
        toolResults: Promise.resolve([]),
        totalUsage: Promise.resolve(makeUsage(100, 50)),
        warnings: Promise.resolve(undefined),
        providerMetadata: Promise.resolve(undefined),
        request: Promise.resolve({} as any), // eslint-disable-line @typescript-eslint/no-explicit-any
        response: Promise.resolve({} as any), // eslint-disable-line @typescript-eslint/no-explicit-any
        steps: Promise.resolve([]),
        fullStream: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        experimental_partialOutputStream: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        rawFinishReason: Promise.resolve(undefined),
        finalStep: Promise.resolve({} as never),
        responseMessages: Promise.resolve([]),
        stream: {} as never,
        partialOutputStream: {} as never,
        elementStream: {} as never,
        output: Promise.resolve(undefined),
        consumeStream: vi.fn(),
        toUIMessageStream: vi.fn(),
        pipeUIMessageStreamToResponse: vi.fn(),
        pipeTextStreamToResponse: vi.fn(),
        toUIMessageStreamResponse: vi.fn(),
        toTextStreamResponse: vi.fn()
      };

      mockStreamText.mockReturnValueOnce(mockStreamResult);

      const mockTools: ToolSet = {
        testTool: {
          description: 'A test tool',
          inputSchema: z.object({ input: z.string() })
        }
      };

      const mockStopWhen = vi.fn();

      const options = {
        modelConfig: { primary: 'gpt-4o-mini' },
        messages: [{ role: 'user' as const, content: 'Test' }],
        temperature: 0.8,
        tools: mockTools,
        stopWhen: mockStopWhen
      };

      provider.streamText(options);

      expect(mockStreamText).toHaveBeenCalledWith({
        model: expect.anything(),
        messages: options.messages,
        temperature: 0.8,
        tools: mockTools,
        stopWhen: mockStopWhen
      });
    });

    it('should calculate costs asynchronously', async () => {
      const mockUsage = makeUsage(1000, 500);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockStreamResult: StreamTextResult<any, any, any> = {
        textStream: createMockTextStream(['test']),
        usage: Promise.resolve(mockUsage),
        text: Promise.resolve('test'),
        finishReason: Promise.resolve('stop' as const),
        content: Promise.resolve([]),
        reasoning: Promise.resolve([]),
        reasoningText: Promise.resolve(undefined),
        files: Promise.resolve([]),
        sources: Promise.resolve([]),
        toolCalls: Promise.resolve([]),
        staticToolCalls: Promise.resolve([]),
        dynamicToolCalls: Promise.resolve([]),
        staticToolResults: Promise.resolve([]),
        dynamicToolResults: Promise.resolve([]),
        toolResults: Promise.resolve([]),
        totalUsage: Promise.resolve(mockUsage),
        warnings: Promise.resolve(undefined),
        providerMetadata: Promise.resolve(undefined),
        request: Promise.resolve({} as any), // eslint-disable-line @typescript-eslint/no-explicit-any
        response: Promise.resolve({} as any), // eslint-disable-line @typescript-eslint/no-explicit-any
        steps: Promise.resolve([]),
        fullStream: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        experimental_partialOutputStream: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        rawFinishReason: Promise.resolve(undefined),
        finalStep: Promise.resolve({} as never),
        responseMessages: Promise.resolve([]),
        stream: {} as never,
        partialOutputStream: {} as never,
        elementStream: {} as never,
        output: Promise.resolve(undefined),
        consumeStream: vi.fn(),
        toUIMessageStream: vi.fn(),
        pipeUIMessageStreamToResponse: vi.fn(),
        pipeTextStreamToResponse: vi.fn(),
        toUIMessageStreamResponse: vi.fn(),
        toTextStreamResponse: vi.fn()
      };

      mockStreamText.mockReturnValueOnce(mockStreamResult);

      const options = {
        modelConfig: { primary: 'gpt-4o-mini' },
        messages: [{ role: 'user' as const, content: 'Test' }]
      };

      const result = provider.streamText(options);

      // Wait for costs to be calculated
      const costs = await result.costs;

      expect(mockGetModelPricing).toHaveBeenCalledWith('openai', 'gpt-4o-mini');
      expect(mockCalculateLLMCost).toHaveBeenCalledWith({
        pricing: expect.any(Object),
        usage: mockUsage,
        useCachedInput: false
      });

      expect(costs).toEqual({
        input: 0.001,
        output: 0.002,
        reasoning: 0,
        total: 0.003
      });
    });
  });

  describe('cost calculation integration', () => {
    beforeEach(() => {
      provider = new LLMProvider(mockProviderConfig);
    });

    it('should use provider and model from config for cost calculation', async () => {
      const mockResult = {
        object: { test: true },
        usage: makeUsage(100, 50),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      };

      mockGenerateObject.mockResolvedValueOnce(mockResult);

      const options = {
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ test: z.boolean() }),
        messages: [{ role: 'user' as const, content: 'Test' }]
      };

      await provider.generateObject(options);

      expect(mockGetModelPricing).toHaveBeenCalledWith('openai', 'gpt-4o-mini');
    });

    it('should pass useCachedInput from provider config to cost calculation', async () => {
      const configWithCaching = {
        ...mockProviderConfig,
        modelConfig: {
          ...mockProviderConfig.modelConfig,
          useCachedInput: true
        }
      };

      provider = new LLMProvider(configWithCaching);

      const mockResult = {
        object: { test: true },
        usage: makeUsage(100, 50),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      };

      mockGenerateObject.mockResolvedValueOnce(mockResult);

      const options = {
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ test: z.boolean() }),
        messages: [{ role: 'user' as const, content: 'Test' }]
      };

      await provider.generateObject(options);

      expect(mockCalculateLLMCost).toHaveBeenCalledWith({
        pricing: expect.any(Object),
        usage: expect.any(Object),
        useCachedInput: true
      });
    });
  });

  describe('calculateLLMCost on the SDK usage shape', () => {
    it('should read cached input and reasoning tokens from the usage details', async () => {
      const actual = await vi.importActual<{ calculateLLMCost: typeof calculateLLMCost }>(
        '../src/utils/costCalculation'
      );
      const usage: LanguageModelUsage = {
        inputTokens: 1_000_000,
        inputTokenDetails: { noCacheTokens: 600_000, cacheReadTokens: 400_000, cacheWriteTokens: 0 },
        outputTokens: 1_000_000,
        outputTokenDetails: { textTokens: 800_000, reasoningTokens: 200_000 },
        totalTokens: 2_000_000
      };
      const pricing = { input: 1, output: 2, cachedInput: 0.5, reasoning: 3 };

      expect(actual.calculateLLMCost({ pricing, usage })).toEqual({
        input: expect.closeTo(1),
        output: expect.closeTo(2),
        reasoning: expect.closeTo(0.6),
        total: expect.closeTo(3.6)
      });
      expect(actual.calculateLLMCost({ pricing, usage, useCachedInput: true })).toEqual({
        input: expect.closeTo(0.2),
        output: expect.closeTo(2),
        reasoning: expect.closeTo(0.6),
        total: expect.closeTo(2.8)
      });
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      provider = new LLMProvider(mockProviderConfig);
    });

    it('should handle string errors in validation retry failure message', async () => {
      const stringError = 'String error message';
      mockNoObjectGeneratedErrorIsInstance.mockReturnValue(true);

      mockGenerateObject.mockRejectedValueOnce(stringError);

      const options = {
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ name: z.string() }),
        messages: [{ role: 'user' as const, content: 'Test' }],
        validationRetries: 1
      };

      await expect(provider.generateObject(options)).rejects.toThrow(
        'Failed to generate object after 1 validation attempts. Last error: String error message'
      );
    });

    it('should handle non-string, non-Error objects in validation retry failure message', async () => {
      const objectError = { code: 'VALIDATION_FAILED', details: 'Invalid format' };
      mockNoObjectGeneratedErrorIsInstance.mockReturnValue(true);

      mockGenerateObject.mockRejectedValueOnce(objectError);

      const options = {
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ name: z.string() }),
        messages: [{ role: 'user' as const, content: 'Test' }],
        validationRetries: 1
      };

      await expect(provider.generateObject(options)).rejects.toThrow(
        'Failed to generate object after 1 validation attempts. Last error: [object Object]'
      );
    });
  });

  describe('performance tracking', () => {
    beforeEach(() => {
      provider = new LLMProvider(mockProviderConfig);
    });

    it('should track latency for generateObject calls', async () => {
      const mockResult = {
        object: { test: true },
        usage: makeUsage(100, 50),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      };

      // Mock a delay to ensure measurable latency
      mockGenerateObject.mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return mockResult;
      });

      const options = {
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ test: z.boolean() }),
        messages: [{ role: 'user' as const, content: 'Test' }]
      };

      const result = await provider.generateObject(options);

      expect(result.latencyMs).toBeGreaterThan(0);
      expect(typeof result.latencyMs).toBe('number');
    });

    it('should track latency for streamText calls', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockStreamResult: StreamTextResult<any, any, any> = {
        textStream: createMockTextStream(['test']),
        usage: Promise.resolve(makeUsage(100, 50)),
        text: Promise.resolve('test'),
        finishReason: Promise.resolve('stop' as const),
        content: Promise.resolve([]),
        reasoning: Promise.resolve([]),
        reasoningText: Promise.resolve(undefined),
        files: Promise.resolve([]),
        sources: Promise.resolve([]),
        toolCalls: Promise.resolve([]),
        staticToolCalls: Promise.resolve([]),
        dynamicToolCalls: Promise.resolve([]),
        staticToolResults: Promise.resolve([]),
        dynamicToolResults: Promise.resolve([]),
        toolResults: Promise.resolve([]),
        totalUsage: Promise.resolve(makeUsage(100, 50)),
        warnings: Promise.resolve(undefined),
        providerMetadata: Promise.resolve(undefined),
        request: Promise.resolve({} as any), // eslint-disable-line @typescript-eslint/no-explicit-any
        response: Promise.resolve({} as any), // eslint-disable-line @typescript-eslint/no-explicit-any
        steps: Promise.resolve([]),
        fullStream: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        experimental_partialOutputStream: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        rawFinishReason: Promise.resolve(undefined),
        finalStep: Promise.resolve({} as never),
        responseMessages: Promise.resolve([]),
        stream: {} as never,
        partialOutputStream: {} as never,
        elementStream: {} as never,
        output: Promise.resolve(undefined),
        consumeStream: vi.fn(),
        toUIMessageStream: vi.fn(),
        pipeUIMessageStreamToResponse: vi.fn(),
        pipeTextStreamToResponse: vi.fn(),
        toUIMessageStreamResponse: vi.fn(),
        toTextStreamResponse: vi.fn()
      };

      mockStreamText.mockReturnValueOnce(mockStreamResult);

      const options = {
        modelConfig: { primary: 'gpt-4o-mini' },
        messages: [{ role: 'user' as const, content: 'Test' }]
      };

      const result = provider.streamText(options);

      expect(result.latencyMs).toBeGreaterThan(0);
      expect(typeof result.latencyMs).toBe('number');
    });
  });

  describe('generateObjectParallel', () => {
    beforeEach(() => {
      provider = new LLMProvider(mockProviderConfig);
    });

    it('should handle empty requests array', async () => {
      const result = await provider.generateObjectParallel({ requests: [] });

      expect(result).toEqual([]);
      expect(mockGenerateObject).not.toHaveBeenCalled();
    });

    it('should process single request correctly', async () => {
      const mockResult = {
        object: { name: 'Test' },
        usage: makeUsage(100, 50),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      };

      mockGenerateObject.mockResolvedValueOnce(mockResult);

      const requests = [
        {
          modelConfig: { primary: 'gpt-4o-mini' },
          schema: z.object({ name: z.string() }),
          messages: [{ role: 'user' as const, content: 'Test 1' }]
        }
      ];

      const results = await provider.generateObjectParallel({ requests });

      expect(results).toHaveLength(1);
      expect(results[0].object.name).toBe('Test');
      expect(mockGenerateObject).toHaveBeenCalledTimes(1);
    });

    it('should process multiple requests in parallel within concurrency limit', async () => {
      const mockResults = [
        {
          object: { name: 'Test1' },
          usage: makeUsage(100, 50),
          finishReason: 'stop' as const,
          reasoning: undefined,
          warnings: undefined,
          request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          providerMetadata: undefined,
          toJsonResponse: vi.fn()
        },
        {
          object: { name: 'Test2' },
          usage: makeUsage(100, 50),
          finishReason: 'stop' as const,
          reasoning: undefined,
          warnings: undefined,
          request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          providerMetadata: undefined,
          toJsonResponse: vi.fn()
        },
        {
          object: { name: 'Test3' },
          usage: makeUsage(100, 50),
          finishReason: 'stop' as const,
          reasoning: undefined,
          warnings: undefined,
          request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          providerMetadata: undefined,
          toJsonResponse: vi.fn()
        }
      ];

      mockGenerateObject
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])
        .mockResolvedValueOnce(mockResults[2]);

      const requests = [
        {
          modelConfig: { primary: 'gpt-4o-mini' },
          schema: z.object({ name: z.string() }),
          messages: [{ role: 'user' as const, content: 'Test 1' }]
        },
        {
          modelConfig: { primary: 'gpt-4o-mini' },
          schema: z.object({ name: z.string() }),
          messages: [{ role: 'user' as const, content: 'Test 2' }]
        },
        {
          modelConfig: { primary: 'gpt-4o-mini' },
          schema: z.object({ name: z.string() }),
          messages: [{ role: 'user' as const, content: 'Test 3' }]
        }
      ];

      const results = await provider.generateObjectParallel({
        requests,
        maxConcurrent: 5
      });

      expect(results).toHaveLength(3);
      expect(results[0].object.name).toBe('Test1');
      expect(results[1].object.name).toBe('Test2');
      expect(results[2].object.name).toBe('Test3');
      expect(mockGenerateObject).toHaveBeenCalledTimes(3);
    });

    it('should process requests in batches when exceeding concurrency limit', async () => {
      const mockResults = Array.from({ length: 6 }, (_, i) => ({
        object: { name: `Test${i + 1}` },
        usage: makeUsage(100, 50),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      }));

      // Mock each call to return the corresponding result
      mockResults.forEach((result) => {
        mockGenerateObject.mockResolvedValueOnce(result);
      });

      const requests = Array.from({ length: 6 }, (_, i) => ({
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ name: z.string() }),
        messages: [{ role: 'user' as const, content: `Test ${i + 1}` }]
      }));

      const results = await provider.generateObjectParallel({
        requests,
        maxConcurrent: 3
      });

      expect(results).toHaveLength(6);
      expect(mockGenerateObject).toHaveBeenCalledTimes(6);

      // Verify all results are present
      results.forEach((result, index) => {
        expect(result.object.name).toBe(`Test${index + 1}`);
      });
    });

    it('should use default maxConcurrent value of 5', async () => {
      const mockResults = Array.from({ length: 3 }, (_, i) => ({
        object: { name: `Test${i + 1}` },
        usage: makeUsage(100, 50),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      }));

      mockResults.forEach((result) => {
        mockGenerateObject.mockResolvedValueOnce(result);
      });

      const requests = Array.from({ length: 3 }, (_, i) => ({
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ name: z.string() }),
        messages: [{ role: 'user' as const, content: `Test ${i + 1}` }]
      }));

      const results = await provider.generateObjectParallel({ requests });

      expect(results).toHaveLength(3);
      expect(mockGenerateObject).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure scenarios', async () => {
      const successResult = {
        object: { name: 'Success' },
        usage: makeUsage(100, 50),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      };

      const error = new Error('Generation failed');

      mockGenerateObject
        .mockResolvedValueOnce(successResult)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(successResult);

      const requests = [
        {
          modelConfig: { primary: 'gpt-4o-mini' },
          schema: z.object({ name: z.string() }),
          messages: [{ role: 'user' as const, content: 'Test 1' }]
        },
        {
          modelConfig: { primary: 'gpt-4o-mini' },
          schema: z.object({ name: z.string() }),
          messages: [{ role: 'user' as const, content: 'Test 2' }]
        },
        {
          modelConfig: { primary: 'gpt-4o-mini' },
          schema: z.object({ name: z.string() }),
          messages: [{ role: 'user' as const, content: 'Test 3' }]
        }
      ];

      await expect(
        provider.generateObjectParallel({
          requests,
          maxConcurrent: 3
        })
      ).rejects.toThrow('Generation failed');

      expect(mockGenerateObject).toHaveBeenCalledTimes(3);
    });

    it('should handle validation retries in parallel requests', async () => {
      const validationError = new Error('Validation failed');
      const successResult = {
        object: { name: 'Success' },
        usage: makeUsage(100, 50),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      };

      mockNoObjectGeneratedErrorIsInstance.mockReturnValue(true);

      // First request: success immediately Second request: fail once, then succeed
      mockGenerateObject
        .mockResolvedValueOnce(successResult)
        .mockRejectedValueOnce(validationError)
        .mockResolvedValueOnce(successResult);

      const requests = [
        {
          modelConfig: { primary: 'gpt-4o-mini' },
          schema: z.object({ name: z.string() }),
          messages: [{ role: 'user' as const, content: 'Test 1' }]
        },
        {
          modelConfig: { primary: 'gpt-4o-mini' },
          schema: z.object({ name: z.string() }),
          messages: [{ role: 'user' as const, content: 'Test 2' }],
          validationRetries: 2
        }
      ];

      const results = await provider.generateObjectParallel({
        requests,
        maxConcurrent: 2
      });

      expect(results).toHaveLength(2);
      expect(results[0].object.name).toBe('Success');
      expect(results[1].object.name).toBe('Success');
      expect(results[0].attempts).toBe(1);
      expect(results[1].attempts).toBe(2);
      expect(mockGenerateObject).toHaveBeenCalledTimes(3);
    });

    it('should preserve order of results matching request order', async () => {
      const mockResults = [
        {
          object: { id: 1, name: 'First' },
          usage: makeUsage(100, 50),
          finishReason: 'stop' as const,
          reasoning: undefined,
          warnings: undefined,
          request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          providerMetadata: undefined,
          toJsonResponse: vi.fn()
        },
        {
          object: { id: 2, name: 'Second' },
          usage: makeUsage(100, 50),
          finishReason: 'stop' as const,
          reasoning: undefined,
          warnings: undefined,
          request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          providerMetadata: undefined,
          toJsonResponse: vi.fn()
        },
        {
          object: { id: 3, name: 'Third' },
          usage: makeUsage(100, 50),
          finishReason: 'stop' as const,
          reasoning: undefined,
          warnings: undefined,
          request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          providerMetadata: undefined,
          toJsonResponse: vi.fn()
        }
      ];

      // Add delay to second call to test ordering
      mockGenerateObject
        .mockResolvedValueOnce(mockResults[0])
        .mockImplementationOnce(async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return mockResults[1];
        })
        .mockResolvedValueOnce(mockResults[2]);

      const requests = [
        {
          modelConfig: { primary: 'gpt-4o-mini' },
          schema: z.object({ id: z.number(), name: z.string() }),
          messages: [{ role: 'user' as const, content: 'First request' }]
        },
        {
          modelConfig: { primary: 'gpt-4o-mini' },
          schema: z.object({ id: z.number(), name: z.string() }),
          messages: [{ role: 'user' as const, content: 'Second request' }]
        },
        {
          modelConfig: { primary: 'gpt-4o-mini' },
          schema: z.object({ id: z.number(), name: z.string() }),
          messages: [{ role: 'user' as const, content: 'Third request' }]
        }
      ];

      const results = await provider.generateObjectParallel({
        requests,
        maxConcurrent: 3
      });

      expect(results).toHaveLength(3);
      expect(results[0].object.id).toBe(1);
      expect(results[0].object.name).toBe('First');
      expect(results[1].object.id).toBe(2);
      expect(results[1].object.name).toBe('Second');
      expect(results[2].object.id).toBe(3);
      expect(results[2].object.name).toBe('Third');
    });

    it('should calculate costs for all parallel requests', async () => {
      const mockResults = Array.from({ length: 3 }, (_, i) => ({
        object: { name: `Test${i + 1}` },
        usage: makeUsage(100 * (i + 1), 50 * (i + 1)),
        finishReason: 'stop' as const,
        reasoning: undefined,
        warnings: undefined,
        request: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        response: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        providerMetadata: undefined,
        toJsonResponse: vi.fn()
      }));

      mockResults.forEach((result) => {
        mockGenerateObject.mockResolvedValueOnce(result);
      });

      const requests = Array.from({ length: 3 }, (_, i) => ({
        modelConfig: { primary: 'gpt-4o-mini' },
        schema: z.object({ name: z.string() }),
        messages: [{ role: 'user' as const, content: `Test ${i + 1}` }]
      }));

      const results = await provider.generateObjectParallel({
        requests,
        maxConcurrent: 3
      });

      expect(results).toHaveLength(3);

      // Verify cost calculation was called for each request
      expect(mockGetModelPricing).toHaveBeenCalledTimes(3);
      expect(mockCalculateLLMCost).toHaveBeenCalledTimes(3);

      // Verify each result has costs
      results.forEach((result) => {
        expect(result.costs).toEqual({
          input: 0.001,
          output: 0.002,
          reasoning: 0,
          total: 0.003
        });
      });
    });
  });
});
