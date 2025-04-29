import { OpenAIProvider } from '@openvaa/llm';
import { config } from 'dotenv';
import path from 'path';
import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import { Condenser } from '../src/core/condenser';
import { CONDENSATION_TYPE } from '../src/core/types/condensationType';
import { LanguageConfigs } from '../src/languageOptions/configs';

// Load environment variables
const envPath = path.join(__dirname, '../../../.env');
config({ path: envPath });

// Initialize OpenAI provider with API key from environment
const llmProvider = new OpenAIProvider({
  model: 'gpt-4o-mini',
  apiKey: process.env.OPENAI_API_KEY || ''
});

describe('Condenser', () => {
  let condenser: Condenser;

  beforeEach(() => {
    condenser = new Condenser({ llmProvider, languageConfig: LanguageConfigs.en });
  });

  test('should create a new Condenser instance', () => {
    expect(condenser).toBeDefined();
  });

  test('should condense comments into arguments', async () => {
    const comments = [
      'Increasing the minimum wage would help reduce poverty and inequality',
      'Higher minimum wages could force small businesses to lay off workers'
    ];
    const result = await condenser.processComments({ comments, topic: 'Should the minimum wage be increased?' });
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  // Long comments test
  test('should successfully process very long comments', async () => {
    const baseText =
      'Research has shown that UBI can help reduce poverty, improve health outcomes, and provide economic security.';
    const longComment = baseText.repeat(300);
    const longComments = Array(100).fill(longComment);
    const topic = 'Universal basic income';

    const result = await condenser.processComments({
      comments: longComments,
      topic,
      batchSize: 100,
      condensationType: CONDENSATION_TYPE.General
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Check that each argument has the required properties
    result.forEach((arg) => {
      expect(arg).toHaveProperty('argument');
      expect(arg).toHaveProperty('topic');
      expect(typeof arg.argument).toBe('string');
      expect(arg.topic).toBe(topic);
      expect(arg.argument.length).toBeGreaterThan(0);
    });
  });
});

describe('Condenser Edge Cases', () => {
  let condenser: Condenser;

  beforeEach(() => {
    condenser = new Condenser({ llmProvider, languageConfig: LanguageConfigs.en });
  });

  test('should throw an error for empty comments array', async () => {
    await expect(condenser.processComments({ comments: [], topic: 'test topic' })).rejects.toThrow(
      'Comments array cannot be empty'
    );
  });

  test('should throw error for empty topic', async () => {
    await expect(condenser.processComments({ comments: ['Example comment'], topic: '' })).rejects.toThrow(
      'Topic cannot be empty'
    );
  });

  test('should truncate comments exceeding maximum length', async () => {
    // Create a comment that exceeds MAX_COMMENT_LENGTH
    const longText = 'The benefits may be worth the risks in the realm of nuclear power.'.repeat(100);
    const comments = [longText];

    const result = await condenser.processComments({ comments, topic: 'Nuclear power' });

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  test('should handle batch size of 1', async () => {
    const comments = [
      'Nuclear power is a clean and efficient energy source',
      'The risks of nuclear accidents are too high'
    ];

    const result = await condenser.processComments({ comments, topic: 'Nuclear power', batchSize: 1 });

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  test('should handle batch size larger than comments array', async () => {
    const comments = [
      'Public transportation reduces traffic congestion and emissions',
      'Many areas lack the population density to make public transit effective'
    ];

    // Batch size larger than comments array
    const result = await condenser.processComments({ comments, topic: 'Public transportation', batchSize: 10 });

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  test('should handle whitespace-only comments', async () => {
    const comments = ['   ', '\n\t', 'Term limits would bring fresh perspectives to Congress', '  \n  '];
    const result = await condenser.processComments({ comments, topic: 'Congressional term limits' });

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
