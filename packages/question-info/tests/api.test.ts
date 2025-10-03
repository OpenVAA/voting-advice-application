import {
  BooleanQuestion,
  DataRoot,
  QUESTION_TYPE,
  SingleChoiceCategoricalQuestion,
  SingleChoiceOrdinalQuestion
} from '@openvaa/data';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { generateQuestionInfo } from '../src/api';
import { QUESTION_INFO_OPERATION } from '../src/types';
import type { Controller } from '@openvaa/core';
import type { QuestionInfoOptions } from '../src/types';

// No-op controller for tests to prevent logging output
const noOpLogger: Controller = {
  info: () => {},
  warning: () => {},
  error: () => {},
  progress: () => {},
  checkAbort: () => {},
  defineSubOperations: () => {},
  getCurrentOperation: () => null
};

// Mock LLM provider with new API
const mockLLMProvider = {
  generateObjectParallel: vi.fn().mockResolvedValue([])
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any

// Mock LLM model
const mockLLMModel = 'gpt-4';

// Create test data root
function createTestDataRoot(): DataRoot {
  return new DataRoot();
}

// Create test questions of different types
function createBooleanQuestion(root: DataRoot): BooleanQuestion {
  return new BooleanQuestion({
    data: {
      id: 'boolean-question-1',
      type: QUESTION_TYPE.Boolean,
      name: 'Do you support renewable energy?',
      categoryId: 'test-category',
      info: 'A question about renewable energy support'
    },
    root
  });
}

function createSingleChoiceOrdinalQuestion(root: DataRoot): SingleChoiceOrdinalQuestion {
  return new SingleChoiceOrdinalQuestion({
    data: {
      id: 'ordinal-question-1',
      type: QUESTION_TYPE.SingleChoiceOrdinal,
      name: 'How important is climate change to you?',
      categoryId: 'test-category',
      info: 'A Likert scale question about climate change importance',
      choices: [
        { id: '1', label: 'Not at all important', normalizableValue: 1 },
        { id: '2', label: 'Somewhat important', normalizableValue: 2 },
        { id: '3', label: 'Important', normalizableValue: 3 },
        { id: '4', label: 'Very important', normalizableValue: 4 },
        { id: '5', label: 'Extremely important', normalizableValue: 5 }
      ]
    },
    root
  });
}

function createSingleChoiceCategoricalQuestion(root: DataRoot): SingleChoiceCategoricalQuestion {
  return new SingleChoiceCategoricalQuestion({
    data: {
      id: 'categorical-question-1',
      type: QUESTION_TYPE.SingleChoiceCategorical,
      name: 'What is your preferred energy source?',
      categoryId: 'test-category',
      info: 'A categorical question about energy preferences',
      choices: [
        { id: 'solar', label: 'Solar' },
        { id: 'wind', label: 'Wind' },
        { id: 'nuclear', label: 'Nuclear' },
        { id: 'fossil', label: 'Fossil fuels' }
      ]
    },
    root
  });
}

// Create test options
function createTestOptions(operations: Array<keyof typeof QUESTION_INFO_OPERATION>): QuestionInfoOptions {
  return {
    runId: 'test-run-id',
    operations: operations.map((op) => QUESTION_INFO_OPERATION[op]),
    language: 'en',
    modelConfig: { primary: mockLLMModel },
    llmProvider: mockLLMProvider,
    controller: noOpLogger,
    llmModel: mockLLMModel
  } as QuestionInfoOptions;
}

describe('generateQuestionInfo API', () => {
  let root: DataRoot;
  let booleanQuestion: BooleanQuestion;
  let ordinalQuestion: SingleChoiceOrdinalQuestion;
  let categoricalQuestion: SingleChoiceCategoricalQuestion;

  beforeEach(() => {
    root = createTestDataRoot();
    booleanQuestion = createBooleanQuestion(root);
    ordinalQuestion = createSingleChoiceOrdinalQuestion(root);
    categoricalQuestion = createSingleChoiceCategoricalQuestion(root);

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Configuration 1: Single Boolean Question', () => {
    test('should handle single boolean question with info sections operation', async () => {
      const questions = [booleanQuestion];
      const options = createTestOptions(['InfoSections']);

      // Mock successful LLM response
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: {
            infoSections: [
              {
                title: 'Environmental Impact',
                content: 'This question assesses support for renewable energy sources.'
              }
            ]
          },
          usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
          response: { modelId: mockLLMModel },
          finishReason: 'stop',
          latencyMs: 10,
          attempts: 1,
          costs: { total: 0 }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].object.questionId).toBe('boolean-question-1');
      expect(results[0].object.questionName).toBe('Do you support renewable energy?');
      expect(results[0].object.infoSections).toBeDefined();
      expect(results[0].object.infoSections).toHaveLength(1);
      expect(results[0].object.terms).toBeUndefined();
      expect(results[0].success).toBe(true);
    });

    test('should handle single boolean question with terms operation', async () => {
      const questions = [booleanQuestion];
      const options = createTestOptions(['Terms']);

      // Mock successful LLM response
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: {
            terms: [
              {
                triggers: [],
                title: 'Renewable Energy',
                content: 'Energy from sources that are naturally replenished.'
              }
            ]
          },
          usage: { inputTokens: 11, outputTokens: 12, totalTokens: 23 },
          response: { modelId: mockLLMModel },
          finishReason: 'stop',
          latencyMs: 10,
          attempts: 1,
          costs: { total: 0 }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].object.questionId).toBe('boolean-question-1');
      expect(results[0].object.questionName).toBe('Do you support renewable energy?');
      expect(results[0].object.infoSections).toBeUndefined();
      expect(results[0].object.terms).toBeDefined();
      expect(results[0].object.terms).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    test('should handle single boolean question with both operations', async () => {
      const questions = [booleanQuestion];
      const options = createTestOptions(['InfoSections', 'Terms']);

      // Mock successful LLM response
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: {
            infoSections: [
              {
                title: 'Environmental Impact',
                content: 'This question assesses support for renewable energy sources.'
              }
            ],
            terms: [
              {
                triggers: [],
                title: 'Renewable Energy',
                content: 'Energy from sources that are naturally replenished.'
              }
            ]
          },
          usage: { inputTokens: 13, outputTokens: 14, totalTokens: 27 },
          response: { modelId: mockLLMModel },
          finishReason: 'stop',
          latencyMs: 10,
          attempts: 1,
          costs: { total: 0 }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].object.infoSections).toBeDefined();
      expect(results[0].object.infoSections).toHaveLength(1);
      expect(results[0].object.terms).toBeDefined();
      expect(results[0].object.terms).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });
  });

  describe('Configuration 2: Single Ordinal Question', () => {
    test('should handle single ordinal question with info sections operation', async () => {
      const questions = [ordinalQuestion];
      const options = createTestOptions(['InfoSections']);

      // Mock successful LLM response
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: {
            infoSections: [
              {
                title: 'Climate Change Priority',
                content: 'This Likert scale question measures the perceived importance of climate change.'
              }
            ]
          },
          usage: { inputTokens: 15, outputTokens: 16, totalTokens: 31 },
          response: { modelId: mockLLMModel },
          finishReason: 'stop',
          latencyMs: 10,
          attempts: 1,
          costs: { total: 0 }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].object.questionId).toBe('ordinal-question-1');
      expect(results[0].object.questionName).toBe('How important is climate change to you?');
      expect(results[0].object.infoSections).toBeDefined();
      expect(results[0].object.infoSections).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    test('should handle single ordinal question with terms operation', async () => {
      const questions = [ordinalQuestion];
      const options = createTestOptions(['Terms']);

      // Mock successful LLM response
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: {
            terms: [
              {
                triggers: [],
                title: 'Likert Scale',
                content: 'A psychometric scale commonly used in research.'
              },
              {
                triggers: [],
                title: 'Climate Change',
                content: 'Long-term changes in global weather patterns.'
              }
            ]
          },
          usage: { inputTokens: 17, outputTokens: 18, totalTokens: 35 },
          response: { modelId: mockLLMModel },
          finishReason: 'stop',
          latencyMs: 10,
          attempts: 1,
          costs: { total: 0 }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].object.terms).toBeDefined();
      expect(results[0].object.terms).toHaveLength(2);
      expect(results[0].success).toBe(true);
    });
  });

  describe('Configuration 3: Single Categorical Question', () => {
    test('should handle single categorical question with info sections operation', async () => {
      const questions = [categoricalQuestion];
      const options = createTestOptions(['InfoSections']);

      // Mock successful LLM response
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: {
            infoSections: [
              {
                title: 'Energy Source Preferences',
                content: 'This question explores preferences for different energy generation methods.'
              }
            ]
          },
          usage: { inputTokens: 19, outputTokens: 20, totalTokens: 39 },
          response: { modelId: mockLLMModel },
          finishReason: 'stop',
          latencyMs: 10,
          attempts: 1,
          costs: { total: 0 }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].object.questionId).toBe('categorical-question-1');
      expect(results[0].object.questionName).toBe('What is your preferred energy source?');
      expect(results[0].object.infoSections).toBeDefined();
      expect(results[0].object.infoSections).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    test('should handle single categorical question with terms operation', async () => {
      const questions = [categoricalQuestion];
      const options = createTestOptions(['Terms']);

      // Mock successful LLM response
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: {
            terms: [
              {
                triggers: [],
                title: 'Solar Energy',
                content: 'Energy harnessed from the sun using photovoltaic cells.'
              },
              {
                triggers: [],
                title: 'Wind Energy',
                content: 'Energy generated from wind turbines.'
              }
            ]
          },
          usage: { inputTokens: 21, outputTokens: 22, totalTokens: 43 },
          response: { modelId: mockLLMModel },
          finishReason: 'stop',
          latencyMs: 10,
          attempts: 1,
          costs: { total: 0 }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].object.terms).toBeDefined();
      expect(results[0].object.terms).toHaveLength(2);
      expect(results[0].success).toBe(true);
    });
  });

  describe('Mixed Question Types', () => {
    test('should handle mixed question types in single request', async () => {
      const questions = [booleanQuestion, ordinalQuestion, categoricalQuestion];
      const options = createTestOptions(['InfoSections']);

      // Mock successful LLM responses for all three questions
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: {
            infoSections: [
              {
                title: 'Environmental Impact',
                content: 'This question assesses support for renewable energy sources.'
              }
            ]
          },
          usage: { inputTokens: 23, outputTokens: 24, totalTokens: 47 },
          response: { modelId: mockLLMModel },
          finishReason: 'stop',
          latencyMs: 10,
          attempts: 1,
          costs: { total: 0 }
        },
        {
          object: {
            infoSections: [
              {
                title: 'Climate Change Priority',
                content: 'This Likert scale question measures the perceived importance of climate change.'
              }
            ]
          },
          usage: { inputTokens: 25, outputTokens: 26, totalTokens: 51 },
          response: { modelId: mockLLMModel },
          finishReason: 'stop',
          latencyMs: 10,
          attempts: 1,
          costs: { total: 0 }
        },
        {
          object: {
            infoSections: [
              {
                title: 'Energy Source Preferences',
                content: 'This question explores preferences for different energy generation methods.'
              }
            ]
          },
          usage: { inputTokens: 27, outputTokens: 28, totalTokens: 55 },
          response: { modelId: mockLLMModel },
          finishReason: 'stop',
          latencyMs: 10,
          attempts: 1,
          costs: { total: 0 }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(3);
      expect(results[0].object.questionId).toBe('boolean-question-1');
      expect(results[1].object.questionId).toBe('ordinal-question-1');
      expect(results[2].object.questionId).toBe('categorical-question-1');
      expect(results.every((r) => r.success)).toBe(true);
    });

    test('should handle mixed question types with both operations', async () => {
      const questions = [booleanQuestion, ordinalQuestion];
      const options = createTestOptions(['InfoSections', 'Terms']);

      // Mock successful LLM responses
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: {
            infoSections: [
              {
                title: 'Environmental Impact',
                content: 'This question assesses support for renewable energy sources.'
              }
            ],
            terms: [
              {
                triggers: [],
                title: 'Renewable Energy',
                content: 'Energy from sources that are naturally replenished.'
              }
            ]
          },
          usage: { inputTokens: 29, outputTokens: 30, totalTokens: 59 },
          response: { modelId: mockLLMModel },
          finishReason: 'stop',
          latencyMs: 10,
          attempts: 1,
          costs: { total: 0 }
        },
        {
          object: {
            infoSections: [
              {
                title: 'Climate Change Priority',
                content: 'This Likert scale question measures the perceived importance of climate change.'
              }
            ],
            terms: [
              {
                triggers: [],
                title: 'Likert Scale',
                content: 'A psychometric scale commonly used in research.'
              }
            ]
          },
          usage: { inputTokens: 31, outputTokens: 32, totalTokens: 63 },
          response: { modelId: mockLLMModel },
          finishReason: 'stop',
          latencyMs: 10,
          attempts: 1,
          costs: { total: 0 }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.object.infoSections && r.object.terms)).toBe(true);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle LLM generation failures gracefully', async () => {
      const questions = [booleanQuestion];
      const options = createTestOptions(['InfoSections']);

      // Mock LLM failure
      mockLLMProvider.generateObjectParallel.mockRejectedValue(new Error('LLM service unavailable'));

      await expect(generateQuestionInfo({ questions, options })).rejects.toThrow(
        'Error generating question info: Error: LLM service unavailable'
      );
    });

    test('should handle invalid question operations', async () => {
      const questions = [booleanQuestion];
      const options = createTestOptions(['InfoSections']);

      // Mock LLM response with invalid data
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: undefined as unknown as Record<string, unknown>,
          usage: { inputTokens: 5, outputTokens: 0, totalTokens: 5 },
          response: { modelId: mockLLMModel },
          finishReason: 'stop',
          latencyMs: 10,
          attempts: 1,
          costs: { total: 0 }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].object.infoSections).toBeUndefined();
      expect(results[0].object.terms).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty questions array', async () => {
      const questions: Array<BooleanQuestion> = [];
      const options = createTestOptions(['InfoSections']);

      await expect(generateQuestionInfo({ questions, options })).rejects.toThrow(
        'No questions provided for info generation.'
      );
    });

    test('should handle questions with minimal data', async () => {
      const minimalQuestion = new BooleanQuestion({
        data: {
          id: 'minimal-question',
          type: QUESTION_TYPE.Boolean,
          name: 'Minimal question',
          categoryId: 'test-category'
        },
        root
      });

      const questions = [minimalQuestion];
      const options = createTestOptions(['InfoSections']);

      // Mock successful LLM response
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: {
            infoSections: [
              {
                title: 'Basic Information',
                content: 'This is a minimal question.'
              }
            ]
          },
          usage: { inputTokens: 7, outputTokens: 8, totalTokens: 15 },
          finishReason: 'stop',
          latencyMs: 100,
          attempts: 1,
          costs: { total: 0.01 },
          fallbackUsed: false,
          response: {
            id: 'test-response-id',
            modelId: mockLLMModel,
            timestamp: new Date(),
            headers: {}
          }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].object.questionName).toBe('Minimal question');
    });
  });
});
