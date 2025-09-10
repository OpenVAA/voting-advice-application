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

// Mock LLM provider with proper typing
const mockLLMProvider = {
  name: 'mock',
  generate: vi.fn(),
  generateWithRetry: vi.fn(),
  generateAndValidateWithRetry: vi.fn(),
  generateMultipleParallel: vi.fn().mockResolvedValue([]),
  generateMultipleSequential: vi.fn()
  // For some reason the compiler is not recognizing the CommonLLMParams interface as part of the QuestionInfoOptions
  // This is a workaround to allow the mock to be used in the tests
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
    llmModel: mockLLMModel,
    llmProvider: mockLLMProvider,
    controller: noOpLogger
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
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: {
            infoSections: [
              {
                title: 'Environmental Impact',
                content: 'This question assesses support for renewable energy sources.'
              }
            ]
          },
          raw: {
            content: '{}',
            usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            model: mockLLMModel,
            finishReason: 'stop'
          }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].questionId).toBe('boolean-question-1');
      expect(results[0].questionName).toBe('Do you support renewable energy?');
      expect(results[0].infoSections).toBeDefined();
      expect(results[0].infoSections).toHaveLength(1);
      expect(results[0].terms).toBeUndefined();
      expect(results[0].success).toBe(true);
      expect(results[0].metadata.language).toBe('en');
      expect(results[0].metadata.llmModel).toBe(mockLLMModel);
    });

    test('should handle single boolean question with terms operation', async () => {
      const questions = [booleanQuestion];
      const options = createTestOptions(['Terms']);

      // Mock successful LLM response
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: {
            terms: [
              {
                term: 'Renewable Energy',
                definition: 'Energy from sources that are naturally replenished.'
              }
            ]
          },
          raw: {
            content: '{}',
            usage: { promptTokens: 11, completionTokens: 12, totalTokens: 23 },
            model: mockLLMModel,
            finishReason: 'stop'
          }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].questionId).toBe('boolean-question-1');
      expect(results[0].questionName).toBe('Do you support renewable energy?');
      expect(results[0].infoSections).toBeUndefined();
      expect(results[0].terms).toBeDefined();
      expect(results[0].terms).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    test('should handle single boolean question with both operations', async () => {
      const questions = [booleanQuestion];
      const options = createTestOptions(['InfoSections', 'Terms']);

      // Mock successful LLM response
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: {
            infoSections: [
              {
                title: 'Environmental Impact',
                content: 'This question assesses support for renewable energy sources.'
              }
            ],
            terms: [
              {
                term: 'Renewable Energy',
                definition: 'Energy from sources that are naturally replenished.'
              }
            ]
          },
          raw: {
            content: '{}',
            usage: { promptTokens: 13, completionTokens: 14, totalTokens: 27 },
            model: mockLLMModel,
            finishReason: 'stop'
          }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].infoSections).toBeDefined();
      expect(results[0].infoSections).toHaveLength(1);
      expect(results[0].terms).toBeDefined();
      expect(results[0].terms).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });
  });

  describe('Configuration 2: Single Ordinal Question', () => {
    test('should handle single ordinal question with info sections operation', async () => {
      const questions = [ordinalQuestion];
      const options = createTestOptions(['InfoSections']);

      // Mock successful LLM response
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: {
            infoSections: [
              {
                title: 'Climate Change Priority',
                content: 'This Likert scale question measures the perceived importance of climate change.'
              }
            ]
          },
          raw: {
            content: '{}',
            usage: { promptTokens: 15, completionTokens: 16, totalTokens: 31 },
            model: mockLLMModel,
            finishReason: 'stop'
          }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].questionId).toBe('ordinal-question-1');
      expect(results[0].questionName).toBe('How important is climate change to you?');
      expect(results[0].infoSections).toBeDefined();
      expect(results[0].infoSections).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    test('should handle single ordinal question with terms operation', async () => {
      const questions = [ordinalQuestion];
      const options = createTestOptions(['Terms']);

      // Mock successful LLM response
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: {
            terms: [
              {
                term: 'Likert Scale',
                definition: 'A psychometric scale commonly used in research.'
              },
              {
                term: 'Climate Change',
                definition: 'Long-term changes in global weather patterns.'
              }
            ]
          },
          raw: {
            content: '{}',
            usage: { promptTokens: 17, completionTokens: 18, totalTokens: 35 },
            model: mockLLMModel,
            finishReason: 'stop'
          }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].terms).toBeDefined();
      expect(results[0].terms).toHaveLength(2);
      expect(results[0].success).toBe(true);
    });
  });

  describe('Configuration 3: Single Categorical Question', () => {
    test('should handle single categorical question with info sections operation', async () => {
      const questions = [categoricalQuestion];
      const options = createTestOptions(['InfoSections']);

      // Mock successful LLM response
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: {
            infoSections: [
              {
                title: 'Energy Source Preferences',
                content: 'This question explores preferences for different energy generation methods.'
              }
            ]
          },
          raw: {
            content: '{}',
            usage: { promptTokens: 19, completionTokens: 20, totalTokens: 39 },
            model: mockLLMModel,
            finishReason: 'stop'
          }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].questionId).toBe('categorical-question-1');
      expect(results[0].questionName).toBe('What is your preferred energy source?');
      expect(results[0].infoSections).toBeDefined();
      expect(results[0].infoSections).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    test('should handle single categorical question with terms operation', async () => {
      const questions = [categoricalQuestion];
      const options = createTestOptions(['Terms']);

      // Mock successful LLM response
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: {
            terms: [
              {
                term: 'Solar Energy',
                definition: 'Energy harnessed from the sun using photovoltaic cells.'
              },
              {
                term: 'Wind Energy',
                definition: 'Energy generated from wind turbines.'
              }
            ]
          },
          raw: {
            content: '{}',
            usage: { promptTokens: 21, completionTokens: 22, totalTokens: 43 },
            model: mockLLMModel,
            finishReason: 'stop'
          }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].terms).toBeDefined();
      expect(results[0].terms).toHaveLength(2);
      expect(results[0].success).toBe(true);
    });
  });

  describe('Mixed Question Types', () => {
    test('should handle mixed question types in single request', async () => {
      const questions = [booleanQuestion, ordinalQuestion, categoricalQuestion];
      const options = createTestOptions(['InfoSections']);

      // Mock successful LLM responses for all three questions
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: {
            infoSections: [
              {
                title: 'Environmental Impact',
                content: 'This question assesses support for renewable energy sources.'
              }
            ]
          },
          raw: {
            content: '{}',
            usage: { promptTokens: 23, completionTokens: 24, totalTokens: 47 },
            model: mockLLMModel,
            finishReason: 'stop'
          }
        },
        {
          parsed: {
            infoSections: [
              {
                title: 'Climate Change Priority',
                content: 'This Likert scale question measures the perceived importance of climate change.'
              }
            ]
          },
          raw: {
            content: '{}',
            usage: { promptTokens: 25, completionTokens: 26, totalTokens: 51 },
            model: mockLLMModel,
            finishReason: 'stop'
          }
        },
        {
          parsed: {
            infoSections: [
              {
                title: 'Energy Source Preferences',
                content: 'This question explores preferences for different energy generation methods.'
              }
            ]
          },
          raw: {
            content: '{}',
            usage: { promptTokens: 27, completionTokens: 28, totalTokens: 55 },
            model: mockLLMModel,
            finishReason: 'stop'
          }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(3);
      expect(results[0].questionId).toBe('boolean-question-1');
      expect(results[1].questionId).toBe('ordinal-question-1');
      expect(results[2].questionId).toBe('categorical-question-1');
      expect(results.every((r) => r.success)).toBe(true);
    });

    test('should handle mixed question types with both operations', async () => {
      const questions = [booleanQuestion, ordinalQuestion];
      const options = createTestOptions(['InfoSections', 'Terms']);

      // Mock successful LLM responses
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: {
            infoSections: [
              {
                title: 'Environmental Impact',
                content: 'This question assesses support for renewable energy sources.'
              }
            ],
            terms: [
              {
                term: 'Renewable Energy',
                definition: 'Energy from sources that are naturally replenished.'
              }
            ]
          },
          raw: {
            content: '{}',
            usage: { promptTokens: 29, completionTokens: 30, totalTokens: 59 },
            model: mockLLMModel,
            finishReason: 'stop'
          }
        },
        {
          parsed: {
            infoSections: [
              {
                title: 'Climate Change Priority',
                content: 'This Likert scale question measures the perceived importance of climate change.'
              }
            ],
            terms: [
              {
                term: 'Likert Scale',
                definition: 'A psychometric scale commonly used in research.'
              }
            ]
          },
          raw: {
            content: '{}',
            usage: { promptTokens: 31, completionTokens: 32, totalTokens: 63 },
            model: mockLLMModel,
            finishReason: 'stop'
          }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.infoSections && r.terms)).toBe(true);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle LLM generation failures gracefully', async () => {
      const questions = [booleanQuestion];
      const options = createTestOptions(['InfoSections']);

      // Mock LLM failure
      mockLLMProvider.generateMultipleParallel.mockRejectedValue(new Error('LLM service unavailable'));

      await expect(generateQuestionInfo({ questions, options })).rejects.toThrow(
        'Error generating question info: Error: LLM service unavailable'
      );
    });

    test('should handle invalid question operations', async () => {
      const questions = [booleanQuestion];
      const options = createTestOptions(['InfoSections']);

      // Mock LLM response with invalid data
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: null, // Invalid response
          raw: {
            content: '{}',
            usage: { promptTokens: 5, completionTokens: 0, totalTokens: 5 },
            model: mockLLMModel,
            finishReason: 'stop'
          }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].infoSections).toBeUndefined();
      expect(results[0].terms).toBeUndefined();
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
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: {
            infoSections: [
              {
                title: 'Basic Information',
                content: 'This is a minimal question.'
              }
            ]
          },
          raw: {
            content: '{}',
            usage: { promptTokens: 7, completionTokens: 8, totalTokens: 15 },
            model: mockLLMModel,
            finishReason: 'stop'
          }
        }
      ]);

      const results = await generateQuestionInfo({ questions, options });

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].questionName).toBe('Minimal question');
    });
  });
});
