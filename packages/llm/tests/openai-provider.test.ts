import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenAIProvider } from '../src/llm-providers/openai-provider';
import { Message } from '../src/types';
import type { ParsedLLMResponse } from '../src/types';
import type { LLMResponseContract } from '../src/utils/llmParser';

// Mock the OpenAI API responses - no actual API calls will be made
const mockCreate = vi.fn().mockImplementation((params) =>
  Promise.resolve({
    choices: [
      {
        message: { content: 'Test response' },
        finish_reason: 'stop'
      }
    ],
    model: params.model,
    usage: {
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 15
    }
  })
);

// Mock the entire OpenAI module to avoid real API calls
// Note: 'test-key' is just a placeholder since we're not making real API calls
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }))
  };
});

describe.sequential('OpenAIProvider', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockCreate.mockImplementation((params) =>
      Promise.resolve({
        choices: [
          {
            message: { content: 'Test response' },
            finish_reason: 'stop'
          }
        ],
        model: params.model,
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        }
      })
    );
  });

  it('should initialize with default values', async () => {
    process.env.LLM_OPENAI_API_KEY = 'test-key';
    const provider = new OpenAIProvider({ apiKey: 'test-key' });
    expect(provider.maxContextTokens).toBe(4096);
    // Test that the default model is used in API calls
    const response = await provider.generate({ messages: [new Message({ role: 'user', content: 'test' })] });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o'
      })
    );
    expect(response.model).toBe('gpt-4o');
  });

  it('should initialize with custom values', () => {
    const provider = new OpenAIProvider({
      model: 'gpt-4',
      maxContextTokens: 8000,
      apiKey: 'test-key'
    });
    expect(provider.maxContextTokens).toBe(8000);
  });

  it('should throw error when no API key is provided', () => {
    // @ts-expect-error Testing invalid input
    expect(() => new OpenAIProvider({})).toThrow('OpenAI API key is required');
  });

  it('should create instance with API key', () => {
    const provider = new OpenAIProvider({ apiKey: 'test-key' });
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('should generate response successfully', async () => {
    const provider = new OpenAIProvider({ apiKey: 'test-key' });
    const messages = [
      new Message({ role: 'system', content: 'You are a helpful assistant' }),
      new Message({ role: 'user', content: 'Hello!' })
    ];

    const response = await provider.generate({ messages });
    expect(response.content).toBe('Test response');
    expect(response.model).toBe('gpt-4o');
    expect(response.usage.totalTokens).toBe(15);
  });

  it('should throw error for empty messages array', async () => {
    const provider = new OpenAIProvider({ apiKey: 'test-key' });
    await expect(provider.generate({ messages: [] })).rejects.toThrow('At least one message is required');
  });

  it('should throw error for invalid temperature', async () => {
    const provider = new OpenAIProvider({ apiKey: 'test-key' });
    const messages = [new Message({ role: 'user', content: 'Hello!' })];
    await expect(provider.generate({ messages, temperature: 1.5 })).rejects.toThrow(
      'Temperature must be between 0 and 1'
    );
  });

  it('should initialize with fallback model', () => {
    const provider = new OpenAIProvider({
      model: 'gpt-4o',
      fallbackModel: 'gpt-4o-mini',
      apiKey: 'test-key'
    });
    expect(provider).toBeInstanceOf(OpenAIProvider);
    expect(provider.model).toBe('gpt-4o');
  });

  it('should work with generateMultipleParallel', async () => {
    const provider = new OpenAIProvider({ apiKey: 'test-key' });
    const inputs = [
      { messages: [new Message({ role: 'user', content: 'Hello 1' })], temperature: 0.7 },
      { messages: [new Message({ role: 'user', content: 'Hello 2' })], temperature: 0.7 }
    ];

    const responses = await provider.generateMultipleParallel({ inputs, parallelBatches: 2 });
    expect(responses).toHaveLength(2);
    expect(responses[0].content).toBe('Test response');
    expect(responses[1].content).toBe('Test response');
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('should work with generateMultipleSequential', async () => {
    const provider = new OpenAIProvider({ apiKey: 'test-key' });
    const inputs = [
      { messages: [new Message({ role: 'user', content: 'Hello 1' })], temperature: 0.7 },
      { messages: [new Message({ role: 'user', content: 'Hello 2' })], temperature: 0.7 }
    ];

    const responses = await provider.generateMultipleSequential({ inputs });
    expect(responses).toHaveLength(2);
    expect(responses[0].content).toBe('Test response');
    expect(responses[1].content).toBe('Test response');
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('should retry on failure with generateWithRetry', async () => {
    const provider = new OpenAIProvider({ apiKey: 'test-key' });
    const messages = [new Message({ role: 'user', content: 'Hello!' })];

    mockCreate
      .mockRejectedValueOnce(new Error('API error 1'))
      .mockRejectedValueOnce(new Error('API error 2'))
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'Successful response' }, finish_reason: 'stop' }],
        model: 'gpt-4o',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
      });

    const response = await provider.generateWithRetry({
      messages,
      maxAttempts: 3,
      defaultWaitTime: 0
    });

    expect(response.content).toBe('Successful response');
    expect(mockCreate).toHaveBeenCalledTimes(3);
  }, 10000);

  it('should switch to fallback model on persistent failure', async () => {
    const provider = new OpenAIProvider({
      apiKey: 'test-key',
      model: 'gpt-4o',
      fallbackModel: 'gpt-4o-mini'
    });
    const messages = [{ role: 'user', content: 'Hello!' }] as Array<Message>;

    mockCreate
      .mockRejectedValueOnce(new Error('API error 1'))
      .mockRejectedValueOnce(new Error('API error 2'))
      .mockRejectedValueOnce(new Error('API error 3'))
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'Fallback response' }, finish_reason: 'stop' }],
        model: 'gpt-4o-mini',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
      });

    const response = await provider.generateWithRetry({ messages, maxAttempts: 3, defaultWaitTime: 0 });

    expect(response.content).toBe('Fallback response');
    expect(response.model).toBe('gpt-4o-mini');
    expect(mockCreate).toHaveBeenCalledTimes(4);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-4o' }));
    expect(mockCreate).toHaveBeenLastCalledWith(expect.objectContaining({ model: 'gpt-4o-mini' }));
  }, 10000);

  it('should throw error if fallback model also fails', async () => {
    const provider = new OpenAIProvider({
      apiKey: 'test-key',
      model: 'gpt-4o',
      fallbackModel: 'gpt-4o-mini'
    });
    const messages = [new Message({ role: 'user', content: 'Hello!' })];

    mockCreate.mockRejectedValue(new Error('Persistent API error'));

    await expect(provider.generateWithRetry({ messages, maxAttempts: 3, defaultWaitTime: 0 })).rejects.toThrow(
      "Primary model 'gpt-4o' failed after 3 attempts. Fallback model 'gpt-4o-mini' also failed. Last error: OpenAI API error: Persistent API error"
    );
    expect(mockCreate).toHaveBeenCalledTimes(4);
  }, 20000);

  describe('generateAndValidateWithRetry', () => {
    // Mock validation contracts for testing
    const successfulContract: LLMResponseContract<{ message: string }> = {
      validate: (obj: unknown): obj is { message: string } => {
        return (
          typeof obj === 'object' &&
          obj !== null &&
          'message' in obj &&
          typeof (obj as { message: unknown }).message === 'string'
        );
      }
    };

    const failingContract: LLMResponseContract<{ message: string }> = {
      validate: (_obj: unknown): _obj is { message: string } => false // Always fails validation
    };

    it('should successfully validate and return parsed response', async () => {
      const provider = new OpenAIProvider({ apiKey: 'test-key' });
      const messages = [new Message({ role: 'user', content: 'Generate JSON with message field' })];

      // Mock API to return valid JSON
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"message": "Hello, world!"}' }, finish_reason: 'stop' }],
        model: 'gpt-4o',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
      });

      const result: ParsedLLMResponse<{ message: string }> = await provider.generateAndValidateWithRetry({
        messages,
        temperature: 0.7,
        responseContract: successfulContract
      });

      expect(result.parsed).toEqual({ message: 'Hello, world!' });
      expect(result.raw.content).toBe('{"message": "Hello, world!"}');
      expect(result.raw.model).toBe('gpt-4o');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should retry on validation failure and eventually succeed', async () => {
      const provider = new OpenAIProvider({ apiKey: 'test-key' });
      const messages = [new Message({ role: 'user', content: 'Generate JSON with message field' })];

      // Mock API responses: first two invalid, third valid
      mockCreate
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'invalid json' }, finish_reason: 'stop' }],
          model: 'gpt-4o',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"wrong": "format"}' }, finish_reason: 'stop' }],
          model: 'gpt-4o',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"message": "Success!"}' }, finish_reason: 'stop' }],
          model: 'gpt-4o',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        });

      const result = await provider.generateAndValidateWithRetry({
        messages,
        temperature: 0.7,
        responseContract: successfulContract,
        validationAttempts: 3
      });

      expect(result.parsed).toEqual({ message: 'Success!' });
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should throw error after all validation attempts fail', async () => {
      const provider = new OpenAIProvider({ apiKey: 'test-key' });
      const messages = [new Message({ role: 'user', content: 'Generate JSON' })];

      // Mock API to always return valid JSON that fails our contract
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '{"wrong": "format"}' }, finish_reason: 'stop' }],
        model: 'gpt-4o',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
      });

      await expect(
        provider.generateAndValidateWithRetry({
          messages,
          temperature: 0.7,
          responseContract: failingContract,
          validationAttempts: 2
        })
      ).rejects.toThrow('All 2 validation attempts failed');

      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should handle JSON parsing errors during validation', async () => {
      const provider = new OpenAIProvider({ apiKey: 'test-key' });
      const messages = [new Message({ role: 'user', content: 'Generate JSON' })];

      // Mock API to return malformed JSON first, then valid
      mockCreate
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'This is not JSON at all' }, finish_reason: 'stop' }],
          model: 'gpt-4o',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"message": "Fixed!"}' }, finish_reason: 'stop' }],
          model: 'gpt-4o',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        });

      const result = await provider.generateAndValidateWithRetry({
        messages,
        temperature: 0.7,
        responseContract: successfulContract,
        validationAttempts: 3
      });

      expect(result.parsed).toEqual({ message: 'Fixed!' });
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateMultipleParallel with validation', () => {
    const testContract: LLMResponseContract<{ result: string }> = {
      validate: (obj: unknown): obj is { result: string } => {
        return (
          typeof obj === 'object' &&
          obj !== null &&
          'result' in obj &&
          typeof (obj as { result: unknown }).result === 'string'
        );
      }
    };

    it('should handle multiple parallel requests with validation', async () => {
      const provider = new OpenAIProvider({ apiKey: 'test-key' });
      const inputs = [
        { messages: [new Message({ role: 'user', content: 'Request 1' })], temperature: 0.7 },
        { messages: [new Message({ role: 'user', content: 'Request 2' })], temperature: 0.7 }
      ];

      // Mock valid JSON responses
      mockCreate
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"result": "Response 1"}' }, finish_reason: 'stop' }],
          model: 'gpt-4o',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"result": "Response 2"}' }, finish_reason: 'stop' }],
          model: 'gpt-4o',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        });

      const results: Array<ParsedLLMResponse<{ result: string }>> = await provider.generateMultipleParallel({
        inputs,
        responseContract: testContract,
        parallelBatches: 2
      });

      expect(results).toHaveLength(2);
      expect(results[0].parsed).toEqual({ result: 'Response 1' });
      expect(results[1].parsed).toEqual({ result: 'Response 2' });
      expect(results[0].raw.model).toBe('gpt-4o');
      expect(results[1].raw.model).toBe('gpt-4o');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed success/failure with validation and retries', async () => {
      const provider = new OpenAIProvider({ apiKey: 'test-key' });
      const inputs = [
        { messages: [new Message({ role: 'user', content: 'Request 1' })], temperature: 0.7 },
        { messages: [new Message({ role: 'user', content: 'Request 2' })], temperature: 0.7 }
      ];

      // Mock responses: first request fails once then succeeds, second succeeds immediately
      mockCreate
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'invalid json' }, finish_reason: 'stop' }],
          model: 'gpt-4o',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"result": "Response 2"}' }, finish_reason: 'stop' }],
          model: 'gpt-4o',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"result": "Response 1"}' }, finish_reason: 'stop' }],
          model: 'gpt-4o',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        });

      const results = await provider.generateMultipleParallel({
        inputs,
        responseContract: testContract,
        parallelBatches: 2,
        validationAttempts: 2
      });

      expect(results).toHaveLength(2);
      expect(results[0].parsed).toEqual({ result: 'Response 1' });
      expect(results[1].parsed).toEqual({ result: 'Response 2' });
      expect(mockCreate).toHaveBeenCalledTimes(3); // First request retried once
    });

    it('should work with existing generateMultipleParallel behavior (without validation)', async () => {
      const provider = new OpenAIProvider({ apiKey: 'test-key' });
      const inputs = [
        { messages: [new Message({ role: 'user', content: 'Hello 1' })], temperature: 0.7 },
        { messages: [new Message({ role: 'user', content: 'Hello 2' })], temperature: 0.7 }
      ];

      // This should call the overload without validation
      const responses = await provider.generateMultipleParallel({ inputs, parallelBatches: 2 });

      expect(responses).toHaveLength(2);
      expect(responses[0].content).toBe('Test response');
      expect(responses[1].content).toBe('Test response');
      expect(mockCreate).toHaveBeenCalledTimes(2);

      // Verify these are raw LLMResponse objects, not ParsedLLMResponse
      expect('parsed' in responses[0]).toBe(false);
      expect('raw' in responses[0]).toBe(false);
      expect(responses[0]).toHaveProperty('content');
      expect(responses[0]).toHaveProperty('model');
      expect(responses[0]).toHaveProperty('usage');
    });

    it('should fail entire operation if one request never validates', async () => {
      const provider = new OpenAIProvider({ apiKey: 'test-key' });
      const inputs = [
        { messages: [new Message({ role: 'user', content: 'Request 1' })], temperature: 0.7 },
        { messages: [new Message({ role: 'user', content: 'Request 2' })], temperature: 0.7 }
      ];

      // Mock responses: first request succeeds, second always fails validation
      mockCreate
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"result": "Success!"}' }, finish_reason: 'stop' }],
          model: 'gpt-4o',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        })
        .mockResolvedValue({
          choices: [{ message: { content: 'always invalid' }, finish_reason: 'stop' }],
          model: 'gpt-4o',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        });

      await expect(
        provider.generateMultipleParallel({
          inputs,
          responseContract: testContract,
          parallelBatches: 2,
          validationAttempts: 2
        })
      ).rejects.toThrow('All 2 validation attempts failed');

      // Even though first request would have succeeded, we get nothing back
      expect(mockCreate).toHaveBeenCalledTimes(3); // 1 success + 2 failed attempts
    });
  });
});
