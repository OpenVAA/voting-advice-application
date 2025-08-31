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
import type { QuestionInfoOptions } from '../src/types';

// Mock LLM provider
const mockLLMProvider = {
  name: 'mock',
  generateMultipleParallel: vi.fn(),
  generateMultipleSequential: vi.fn(),
  generateAndValidateWithRetry: vi.fn(),
  generate: vi.fn(),
  generateWithRetry: vi.fn()
  // There is an issue with typing with the abstract LLM Provider. This is a workaround to allow the mock to be used in the tests
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any

// Mock LLM model
const mockLLMModel = 'gpt-4';

// Create test data root
function createTestDataRoot(): DataRoot {
  return new DataRoot();
}

describe('Question Type Configurations', () => {
  let root: DataRoot;

  beforeEach(() => {
    root = createTestDataRoot();
    vi.clearAllMocks();
  });

  describe('Configuration 1: Boolean Questions', () => {
    test('should handle boolean question with yes/no answers', async () => {
      const booleanQuestion = new BooleanQuestion({
        data: {
          id: 'boolean-1',
          type: QUESTION_TYPE.Boolean,
          name: 'Do you support universal healthcare?',
          categoryId: 'health-category',
          info: 'A simple yes/no question about healthcare policy'
        },
        root
      });

      const questions = [booleanQuestion];
      const options = {
        runId: 'test-run-id',
        operations: [QUESTION_INFO_OPERATION.InfoSections],
        language: 'en',
        llmModel: mockLLMModel,
        llmProvider: mockLLMProvider
      } as QuestionInfoOptions;

      // Mock successful LLM response
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: {
            infoSections: [
              {
                title: 'Healthcare Policy',
                content: 'This question assesses support for universal healthcare systems.'
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
      expect(results[0].questionId).toBe('boolean-1');
      expect(results[0].questionName).toBe('Do you support universal healthcare?');
      expect(results[0].infoSections).toBeDefined();
      expect(results[0].success).toBe(true);
    });

    test('should handle boolean question with terms generation', async () => {
      const booleanQuestion = new BooleanQuestion({
        data: {
          id: 'boolean-2',
          type: QUESTION_TYPE.Boolean,
          name: 'Should the government regulate social media?',
          categoryId: 'tech-category',
          info: 'A question about government regulation of technology platforms'
        },
        root
      });

      const questions = [booleanQuestion];
      const options: QuestionInfoOptions = {
        runId: 'test-run-id',
        operations: [QUESTION_INFO_OPERATION.Terms],
        language: 'en',
        llmModel: mockLLMModel,
        llmProvider: mockLLMProvider
      } as QuestionInfoOptions;

      // Mock successful LLM response
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: {
            terms: [
              {
                term: 'Social Media Regulation',
                definition: 'Government oversight of social media platforms and content.'
              },
              {
                term: 'Platform Governance',
                definition: 'The rules and policies that govern online platforms.'
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
      expect(results[0].terms).toBeDefined();
      expect(results[0].terms).toHaveLength(2);
      expect(results[0].success).toBe(true);
    });
  });

  describe('Configuration 2: Ordinal Questions', () => {
    test('should handle 5-point Likert scale question', async () => {
      const ordinalQuestion = new SingleChoiceOrdinalQuestion({
        data: {
          id: 'ordinal-1',
          type: QUESTION_TYPE.SingleChoiceOrdinal,
          name: 'How satisfied are you with public transportation?',
          categoryId: 'transport-category',
          info: 'A 5-point Likert scale question about public transportation satisfaction',
          choices: [
            { id: '1', label: 'Very dissatisfied', normalizableValue: 1 },
            { id: '2', label: 'Dissatisfied', normalizableValue: 2 },
            { id: '3', label: 'Neutral', normalizableValue: 3 },
            { id: '4', label: 'Satisfied', normalizableValue: 4 },
            { id: '5', label: 'Very satisfied', normalizableValue: 5 }
          ]
        },
        root
      });

      const questions = [ordinalQuestion];
      const options = {
        runId: 'test-run-id',
        operations: [QUESTION_INFO_OPERATION.InfoSections],
        language: 'en',
        llmModel: mockLLMModel,
        llmProvider: mockLLMProvider
      } as QuestionInfoOptions;

      // Mock successful LLM response
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: {
            infoSections: [
              {
                title: 'Public Transportation Satisfaction',
                content: 'This Likert scale question measures satisfaction with public transportation services.'
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
      expect(results[0].questionId).toBe('ordinal-1');
      expect(results[0].questionName).toBe('How satisfied are you with public transportation?');
      expect(results[0].infoSections).toBeDefined();
      expect(results[0].success).toBe(true);
    });

    test('should handle 7-point Likert scale question', async () => {
      const ordinalQuestion = new SingleChoiceOrdinalQuestion({
        data: {
          id: 'ordinal-2',
          type: QUESTION_TYPE.SingleChoiceOrdinal,
          name: 'How strongly do you agree with this statement: "Climate change is the most pressing issue of our time"?',
          categoryId: 'climate-category',
          info: 'A 7-point Likert scale question about climate change urgency',
          choices: [
            { id: '1', label: 'Strongly disagree', normalizableValue: 1 },
            { id: '2', label: 'Disagree', normalizableValue: 2 },
            { id: '3', label: 'Somewhat disagree', normalizableValue: 3 },
            { id: '4', label: 'Neither agree nor disagree', normalizableValue: 4 },
            { id: '5', label: 'Somewhat agree', normalizableValue: 5 },
            { id: '6', label: 'Agree', normalizableValue: 6 },
            { id: '7', label: 'Strongly agree', normalizableValue: 7 }
          ]
        },
        root
      });

      const questions = [ordinalQuestion];
      const options: QuestionInfoOptions = {
        runId: 'test-run-id',
        operations: [QUESTION_INFO_OPERATION.Terms],
        language: 'en',
        llmModel: mockLLMModel,
        llmProvider: mockLLMProvider
      } as QuestionInfoOptions;

      // Mock successful LLM response
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: {
            terms: [
              {
                term: 'Climate Change',
                definition: 'Long-term changes in global weather patterns and average temperatures.'
              },
              {
                term: 'Likert Scale',
                definition: "A psychometric scale commonly used in research to represent people's attitudes."
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
      expect(results[0].terms).toBeDefined();
      expect(results[0].terms).toHaveLength(2);
      expect(results[0].success).toBe(true);
    });
  });

  describe('Configuration 3: Categorical Questions', () => {
    test('should handle categorical question with multiple choices', async () => {
      const categoricalQuestion = new SingleChoiceCategoricalQuestion({
        data: {
          id: 'categorical-1',
          type: QUESTION_TYPE.SingleChoiceCategorical,
          name: 'What is your primary mode of transportation to work?',
          categoryId: 'transport-category',
          info: 'A categorical question about transportation preferences',
          choices: [
            { id: 'car', label: 'Car' },
            { id: 'public', label: 'Public transportation' },
            { id: 'bike', label: 'Bicycle' },
            { id: 'walk', label: 'Walking' },
            { id: 'other', label: 'Other' }
          ]
        },
        root
      });

      const questions = [categoricalQuestion];
      const options: QuestionInfoOptions = {
        runId: 'test-run-id',
        operations: [QUESTION_INFO_OPERATION.InfoSections],
        language: 'en',
        llmModel: mockLLMModel,
        llmProvider: mockLLMProvider
      } as QuestionInfoOptions;

      // Mock successful LLM response
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: {
            infoSections: [
              {
                title: 'Transportation Mode Analysis',
                content: 'This question explores primary transportation preferences for commuting to work.'
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
      expect(results[0].questionId).toBe('categorical-1');
      expect(results[0].questionName).toBe('What is your primary mode of transportation to work?');
      expect(results[0].infoSections).toBeDefined();
      expect(results[0].success).toBe(true);
    });

    test('should handle binary categorical question', async () => {
      const categoricalQuestion = new SingleChoiceCategoricalQuestion({
        data: {
          id: 'categorical-2',
          type: QUESTION_TYPE.SingleChoiceCategorical,
          name: 'Do you identify as a morning person or night person?',
          categoryId: 'personality-category',
          info: 'A binary categorical question about chronotype preferences',
          choices: [
            { id: 'morning', label: 'Morning person' },
            { id: 'night', label: 'Night person' }
          ]
        },
        root
      });

      const questions = [categoricalQuestion];
      const options = {
        runId: 'test-run-id',
        operations: [QUESTION_INFO_OPERATION.Terms],
        language: 'en',
        llmModel: mockLLMModel,
        llmProvider: mockLLMProvider
      } as QuestionInfoOptions;

      // Mock successful LLM response
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: {
            terms: [
              {
                term: 'Chronotype',
                definition: "A person's natural inclination toward the timing of daily activities."
              },
              {
                term: 'Morning Person',
                definition: 'Someone who prefers to be active and alert in the early hours of the day.'
              },
              {
                term: 'Night Person',
                definition: 'Someone who prefers to be active and alert in the evening and night hours.'
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
      expect(results[0].terms).toBeDefined();
      expect(results[0].terms).toHaveLength(3);
      expect(results[0].success).toBe(true);
    });
  });

  describe('Mixed Question Type Scenarios', () => {
    test('should handle combination of all three question types', async () => {
      const booleanQuestion = new BooleanQuestion({
        data: {
          id: 'mixed-1',
          type: QUESTION_TYPE.Boolean,
          name: 'Do you support increasing taxes on high-income earners?',
          categoryId: 'tax-category',
          info: 'A yes/no question about tax policy'
        },
        root
      });

      const ordinalQuestion = new SingleChoiceOrdinalQuestion({
        data: {
          id: 'mixed-2',
          type: QUESTION_TYPE.SingleChoiceOrdinal,
          name: 'How important is reducing income inequality to you?',
          categoryId: 'inequality-category',
          info: 'A 5-point Likert scale question about income inequality',
          choices: [
            { id: '1', label: 'Not important', normalizableValue: 1 },
            { id: '2', label: 'Somewhat important', normalizableValue: 2 },
            { id: '3', label: 'Important', normalizableValue: 3 },
            { id: '4', label: 'Very important', normalizableValue: 4 },
            { id: '5', label: 'Extremely important', normalizableValue: 5 }
          ]
        },
        root
      });

      const categoricalQuestion = new SingleChoiceCategoricalQuestion({
        data: {
          id: 'mixed-3',
          type: QUESTION_TYPE.SingleChoiceCategorical,
          name: 'Which approach do you prefer for reducing income inequality?',
          categoryId: 'policy-category',
          info: 'A categorical question about policy preferences',
          choices: [
            { id: 'taxes', label: 'Progressive taxation' },
            { id: 'education', label: 'Education and training' },
            { id: 'regulation', label: 'Regulation and oversight' },
            { id: 'other', label: 'Other approaches' }
          ]
        },
        root
      });

      const questions = [booleanQuestion, ordinalQuestion, categoricalQuestion];
      const options = {
        runId: 'test-run-id',
        operations: [QUESTION_INFO_OPERATION.InfoSections, QUESTION_INFO_OPERATION.Terms],
        language: 'en',
        llmModel: mockLLMModel,
        llmProvider: mockLLMProvider
      } as QuestionInfoOptions;

      // Mock successful LLM responses for all three questions
      mockLLMProvider.generateMultipleParallel.mockResolvedValue([
        {
          parsed: {
            infoSections: [
              {
                title: 'Tax Policy',
                content: 'This question assesses support for progressive taxation policies.'
              }
            ],
            terms: [
              {
                term: 'Progressive Taxation',
                definition: 'A tax system where higher income earners pay a larger percentage of their income in taxes.'
              }
            ]
          },
          raw: {
            content: '{}',
            usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            model: mockLLMModel,
            finishReason: 'stop'
          }
        },
        {
          parsed: {
            infoSections: [
              {
                title: 'Income Inequality Priority',
                content: 'This Likert scale question measures the perceived importance of reducing income inequality.'
              }
            ],
            terms: [
              {
                term: 'Income Inequality',
                definition: 'The unequal distribution of income among individuals or groups in a society.'
              }
            ]
          },
          raw: {
            content: '{}',
            usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            model: mockLLMModel,
            finishReason: 'stop'
          }
        },
        {
          parsed: {
            infoSections: [
              {
                title: 'Policy Preference Analysis',
                content: 'This question explores preferences for different approaches to reducing income inequality.'
              }
            ],
            terms: [
              {
                term: 'Policy Approaches',
                definition: 'Different strategies and methods used to address social and economic issues.'
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

      expect(results).toHaveLength(3);
      expect(results[0].questionId).toBe('mixed-1');
      expect(results[1].questionId).toBe('mixed-2');
      expect(results[2].questionId).toBe('mixed-3');

      // All results should have both infoSections and terms
      expect(results.every((r) => r.infoSections && r.terms)).toBe(true);
      expect(results.every((r) => r.success)).toBe(true);

      // Verify specific content
      expect(results[0].infoSections![0].title).toBe('Tax Policy');
      expect(results[1].infoSections![0].title).toBe('Income Inequality Priority');
      expect(results[2].infoSections![0].title).toBe('Policy Preference Analysis');
    });
  });
});
