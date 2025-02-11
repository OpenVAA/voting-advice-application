import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Message } from '../llm-provider';
import { OpenAIProvider } from '../openai-provider';

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

describe('OpenAIProvider', () => {
  beforeEach(() => {
    mockCreate.mockClear();
  });

  it('should initialize with default values', async () => {
    process.env.LLM_OPENAI_API_KEY = 'test-key';
    const provider = new OpenAIProvider();
    expect(provider.maxContextTokens).toBe(4096);
    // Test that the default model is used in API calls
    const response = await provider.generate({ messages: [new Message({ role: 'user', content: 'test' })] });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini'
      })
    );
    expect(response.model).toBe('gpt-4o-mini');
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
    delete process.env.LLM_OPENAI_API_KEY;
    expect(() => new OpenAIProvider()).toThrow('OpenAI API key is required');
  });

  it('should generate response successfully', async () => {
    const provider = new OpenAIProvider({ apiKey: 'test-key' });
    const messages = [
      new Message({ role: 'system', content: 'You are a helpful assistant' }),
      new Message({ role: 'user', content: 'Hello!' })
    ];

    const response = await provider.generate({ messages });
    expect(response.content).toBe('Test response');
    expect(response.model).toBe('gpt-4o-mini');
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

  it('should count tokens approximately', async () => {
    const provider = new OpenAIProvider({ apiKey: 'test-key' });
    const result = await provider.countTokens('Hello, world!');
    expect(result.tokens).toBe(4); // ~13 characters / 4 = 4 tokens
  });

  it('should calculate fit comment args count', async () => {
    const provider = new OpenAIProvider({ apiKey: 'test-key', maxContextTokens: 1000 });
    const count = await provider.fitCommentArgsCount();
    expect(count).toBe(20); // 1000 / 50 = 20
  });
});
