import { noOpController } from '@openvaa/core';
import {
  BooleanQuestion,
  DataRoot,
  QUESTION_TYPE,
  SingleChoiceCategoricalQuestion,
  SingleChoiceOrdinalQuestion
} from '@openvaa/data';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { QUESTION_INFO_OPERATION } from '../src';
import { generateQuestionInfo } from '../src/api';
import type { AnyQuestionVariant } from '@openvaa/data';
import type { QuestionInfoOptions } from '../src';

// Mock LLM provider
const mockLLMProvider = {
  generateObjectParallel: vi.fn()
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any

// Mock LLM model
const mockLLMModel = 'gpt-4o';

/** The single argument `generateObjectParallel` is called with. */
interface CapturedProviderCall {
  requests: Array<{ messages: Array<{ role: string; content: string }> }>;
}

/**
 * The composed prompts the mocked provider received, in question order.
 *
 * Assertions on these check what the product composed. Assertions on `results[i].data` alone only see the canned payload the test handed the mock.
 */
function capturedPrompts(): Array<string> {
  // Assert the call first: without it, a regression that makes no call fails as a TypeError on the line below instead of as a missing call.
  expect(mockLLMProvider.generateObjectParallel).toHaveBeenCalledTimes(1);
  const [arg] = mockLLMProvider.generateObjectParallel.mock.calls[0] as [CapturedProviderCall];
  return arg.requests.map((request) => request.messages[0].content);
}

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
        modelConfig: { primary: mockLLMModel },
        llmProvider: mockLLMProvider,
        llmModel: mockLLMModel,
        controller: noOpController,
        fallbackModel: mockLLMModel
      } as QuestionInfoOptions;

      // Mock successful LLM response
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: {
            infoSections: [
              {
                title: 'Healthcare Policy',
                content: 'This question assesses support for universal healthcare systems.'
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
      expect(results[0].data.questionId).toBe('boolean-1');
      expect(results[0].data.infoSections).toBeDefined();

      // The question text must reach the composed prompt: the assertions above also pass when the prompt carries no question.
      expect(capturedPrompts()[0]).toContain('Do you support universal healthcare?');
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
        modelConfig: { primary: mockLLMModel },
        llmProvider: mockLLMProvider,
        llmModel: mockLLMModel,
        controller: noOpController
      } as QuestionInfoOptions;

      // Mock successful LLM response
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: {
            terms: [
              {
                triggers: [],
                title: 'Social Media Regulation',
                content: 'Government oversight of social media platforms and content.'
              },
              {
                triggers: [],
                title: 'Platform Governance',
                content: 'The rules and policies that govern online platforms.'
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
      expect(results[0].data.terms).toBeDefined();
      expect(results[0].data.terms).toHaveLength(2);
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
        modelConfig: { primary: mockLLMModel },
        llmProvider: mockLLMProvider,
        llmModel: mockLLMModel,
        controller: noOpController
      } as QuestionInfoOptions;

      // Mock successful LLM response
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: {
            infoSections: [
              {
                title: 'Public Transportation Satisfaction',
                content: 'This Likert scale question measures satisfaction with public transportation services.'
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
      expect(results[0].data.questionId).toBe('ordinal-1');
      expect(results[0].data.infoSections).toBeDefined();

      // The assertions above read only the canned payload. These check what the product composed.
      const prompt = capturedPrompts()[0];

      // The question's type must reach the prompt. It is read from the constant, so renaming the discriminant cannot leave a stale literal here.
      expect(prompt).toContain(QUESTION_TYPE.SingleChoiceOrdinal);

      // A 5-point and a 7-point ordinal share the type string, so only the choice labels tell them apart. Asserting the joined string also checks the `', '` join and the label order.
      expect(prompt).toContain('Very dissatisfied, Dissatisfied, Neutral, Satisfied, Very satisfied');
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
        modelConfig: { primary: mockLLMModel },
        llmProvider: mockLLMProvider,
        llmModel: mockLLMModel,
        controller: noOpController
      } as QuestionInfoOptions;

      // Mock successful LLM response
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: {
            terms: [
              {
                triggers: [],
                title: 'Climate Change',
                content: 'Long-term changes in global weather patterns and average temperatures.'
              },
              {
                triggers: [],
                title: 'Likert Scale',
                content: "A psychometric scale commonly used in research to represent people's attitudes."
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
      expect(results[0].data.terms).toBeDefined();
      expect(results[0].data.terms).toHaveLength(2);

      // Seven labels here against the 5-point sibling's five. This test runs the `generateTerms` template, so it also checks that `{{choices}}` is filled there.
      expect(capturedPrompts()[0]).toContain(
        'Strongly disagree, Disagree, Somewhat disagree, Neither agree nor disagree, Somewhat agree, Agree, Strongly agree'
      );
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
        modelConfig: { primary: mockLLMModel },
        llmProvider: mockLLMProvider,
        llmModel: mockLLMModel,
        controller: noOpController
      } as QuestionInfoOptions;

      // Mock successful LLM response
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: {
            infoSections: [
              {
                title: 'Transportation Mode Analysis',
                content: 'This question explores primary transportation preferences for commuting to work.'
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
      expect(results[0].data.questionId).toBe('categorical-1');
      expect(results[0].data.infoSections).toBeDefined();
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
        modelConfig: { primary: mockLLMModel },
        llmProvider: mockLLMProvider,
        llmModel: mockLLMModel,
        controller: noOpController
      } as QuestionInfoOptions;

      // Mock successful LLM response
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: {
            terms: [
              {
                triggers: [],
                title: 'Chronotype',
                content: "A person's natural inclination toward the timing of daily activities."
              },
              {
                triggers: [],
                title: 'Morning Person',
                content: 'Someone who prefers to be active and alert in the early hours of the day.'
              },
              {
                triggers: [],
                title: 'Night Person',
                content: 'Someone who prefers to be active and alert in the evening and night hours.'
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
      expect(results[0].data.terms).toBeDefined();
      expect(results[0].data.terms).toHaveLength(3);

      // The assertions above read only the canned payload. This checks that the question's own choice labels reach the prompt.
      const prompt = capturedPrompts()[0];
      expect(prompt).toContain('Morning person');
      expect(prompt).toContain('Night person');
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
        modelConfig: { primary: mockLLMModel },
        llmProvider: mockLLMProvider,
        llmModel: mockLLMModel,
        controller: noOpController
      } as QuestionInfoOptions;

      // Mock successful LLM responses for all three questions
      mockLLMProvider.generateObjectParallel.mockResolvedValue([
        {
          object: {
            infoSections: [
              {
                title: 'Tax Policy',
                content: 'This question assesses support for progressive taxation policies.'
              }
            ],
            terms: [
              {
                triggers: [],
                title: 'Progressive Taxation',
                content: 'A tax system where higher income earners pay a larger percentage of their income in taxes.'
              }
            ]
          },
          usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
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
                title: 'Income Inequality Priority',
                content: 'This Likert scale question measures the perceived importance of reducing income inequality.'
              }
            ],
            terms: [
              {
                triggers: [],
                title: 'Income Inequality',
                content: 'The unequal distribution of income among individuals or groups in a society.'
              }
            ]
          },
          usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
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
                title: 'Policy Preference Analysis',
                content: 'This question explores preferences for different approaches to reducing income inequality.'
              }
            ],
            terms: [
              {
                triggers: [],
                title: 'Policy Approaches',
                content: 'Different strategies and methods used to address social and economic issues.'
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

      expect(results).toHaveLength(3);
      expect(results[0].data.questionId).toBe('mixed-1');
      expect(results[1].data.questionId).toBe('mixed-2');
      expect(results[2].data.questionId).toBe('mixed-3');

      // All results should have both infoSections and terms
      expect(results.every((r) => r.data.infoSections && r.data.terms)).toBe(true);

      // Both operations select the `generateBoth` template, whose `questionType` and `choices` placeholders must be filled per question
      const [booleanPrompt, ordinalPrompt, categoricalPrompt] = capturedPrompts();
      expect(booleanPrompt).toContain('Task 2: Term Definition Generation');
      expect(booleanPrompt).toContain(QUESTION_TYPE.Boolean);
      expect(ordinalPrompt).toContain(QUESTION_TYPE.SingleChoiceOrdinal);
      expect(ordinalPrompt).toContain(
        'Not important, Somewhat important, Important, Very important, Extremely important'
      );
      expect(categoricalPrompt).toContain(QUESTION_TYPE.SingleChoiceCategorical);
      expect(categoricalPrompt).toContain(
        'Progressive taxation, Education and training, Regulation and oversight, Other approaches'
      );

      // The response transformer renames three provider fields; these check the renames.
      // `processingTimeMs` is the provider's `latencyMs` copied verbatim, not a wall-clock measurement, so its exact value checks the rename.
      expect(results[0].llmMetrics.processingTimeMs).toBe(10); // ← llmResponse.latencyMs
      expect(results[0].llmMetrics.nLlmCalls).toBe(1); // ← llmResponse.attempts
      expect(results[0].metadata.modelsUsed).toEqual([mockLLMModel]); // ← llmResponse.response.modelId
    });

    test('composes different prompts for two questions that share a name and differ only in type', async () => {
      // The Configuration fixtures above use differently named questions, and the name is part of the prompt, so comparing their prompts would pass for the wrong reason. Holding the question text constant and varying only `type` isolates the property under test.
      const sharedText = {
        name: 'Should the voting age be lowered?',
        categoryId: 'franchise-category',
        info: 'Identical wording on purpose — only the question type differs.'
      };

      const booleanQuestion = new BooleanQuestion({
        data: { id: 'same-name-boolean', type: QUESTION_TYPE.Boolean, ...sharedText },
        root
      });

      const categoricalQuestion = new SingleChoiceCategoricalQuestion({
        data: {
          id: 'same-name-categorical',
          type: QUESTION_TYPE.SingleChoiceCategorical,
          ...sharedText,
          choices: [
            { id: 'sixteen', label: 'Yes, lower it to 16' },
            { id: 'keep', label: 'No, keep it at 18' }
          ]
        },
        root
      });

      const questions = [booleanQuestion, categoricalQuestion];
      const options = {
        runId: 'test-run-id',
        operations: [QUESTION_INFO_OPERATION.InfoSections],
        language: 'en',
        modelConfig: { primary: mockLLMModel },
        llmProvider: mockLLMProvider,
        llmModel: mockLLMModel,
        controller: noOpController
      } as QuestionInfoOptions;

      const cannedSection = {
        object: {
          infoSections: [{ title: 'Voting Age', content: 'Background on the voting-age franchise.' }]
        },
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        response: { modelId: mockLLMModel },
        finishReason: 'stop',
        latencyMs: 10,
        attempts: 1,
        costs: { total: 0 }
      };
      mockLLMProvider.generateObjectParallel.mockResolvedValue([cannedSection, cannedSection]);

      await generateQuestionInfo({ questions, options });

      const [booleanPrompt, categoricalPrompt] = capturedPrompts();

      // The question type must change the prompt: a composition that reads only `question.name` makes the two prompts identical.
      expect(booleanPrompt).not.toBe(categoricalPrompt);

      // The answering choices must reach the prompt.
      expect(categoricalPrompt).toContain('Yes, lower it to 16');

      // Choices are per question, so the boolean sibling in the same call must not pick up its neighbour's labels. A composition with no choices at all also passes this one, so the two assertions above carry the weight.
      expect(booleanPrompt).not.toContain('Yes, lower it to 16');
    });
  });

  describe('Prompt composition boundary', () => {
    test('rejects a question that arrives without a type, naming the question', async () => {
      // `throwIfVarsMissing` cannot catch this case: the `questionType` variable is present but undefined, so the required-param check passes and the prompt would render the literal text `undefined`.
      const untypedQuestion = {
        id: 'no-type-1',
        name: 'A question that never received a type'
      } as unknown as AnyQuestionVariant;

      const options = {
        runId: 'test-run-id',
        operations: [QUESTION_INFO_OPERATION.InfoSections],
        language: 'en',
        modelConfig: { primary: mockLLMModel },
        llmProvider: mockLLMProvider,
        llmModel: mockLLMModel,
        controller: noOpController
      } as QuestionInfoOptions;

      // Anchored at `^`: the guard sits outside `generateInfo`'s catch, which would prefix the message with `Error generating question info: `. The message also names the failing question.
      await expect(generateQuestionInfo({ questions: [untypedQuestion], options })).rejects.toThrow(
        /^\[question-info\] Question 'no-type-1' \("A question that never received a type"\) has no `type`\./
      );

      // It fails before reaching the provider.
      expect(mockLLMProvider.generateObjectParallel).not.toHaveBeenCalled();
    });
  });
});
