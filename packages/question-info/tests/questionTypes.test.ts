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

// Mock LLM provider (new API)
const mockLLMProvider = {
  generateObjectParallel: vi.fn()
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any

// Mock LLM model
const mockLLMModel = 'gpt-4o';

/** The single argument shape `generateObjectParallel` is called with (measured, not guessed). */
interface CapturedProviderCall {
  requests: Array<{ messages: Array<{ role: string; content: string }> }>;
}

/**
 * The composed prompts the mocked provider actually received, in question order.
 *
 * This is the only way these tests can observe what the PRODUCT computed rather than what the test itself handed the mock. Everything asserted through it is output; everything asserted about `results[i].data` alone is the canned payload coming back unchanged.
 */
function capturedPrompts(): Array<string> {
  // Ordered FIRST and kept HARD on purpose. Without this guard a zero-call regression fails as a TypeError while dereferencing the provider's recorded call — a red on the wrong axis, which is no evidence at all that a prompt was composed. Do not soften this to `expect.soft` and do not simplify it away: reaching the line below is precisely what it certifies.
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

      // The question text must reach the composed prompt. Every assertion above passes even when the prompt carries no question at all — measured by injecting `question: ''` at infoGeneration.ts:76, which leaves all seven of them green. This is the assertion that injection exists to break. Do not weaken it back to a shape that cannot see an empty prompt.
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

      // W-1 — the three assertions above read only the payload this test handed the mock, so they hold no matter what the product composed. Measured, not asserted: both stayed green with the type emptied at infoGeneration.ts:104 AND with the choices emptied at :105 (`F15-A-W1-OLD-Q-1.log`, `F15-A-W1-OLD-C-1.log`, both exit 0). Paired — not replaced — with two assertions on output the PRODUCT built.
      const prompt = capturedPrompts()[0];

      // The question's structural type must reach the prompt. Read from the constant, never re-typed as a literal, so a rename of the discriminant cannot leave a stale copy asserting the old value.
      expect(prompt).toContain(QUESTION_TYPE.SingleChoiceOrdinal);

      // The load-bearing one for THIS block. A 5-point and a 7-point ordinal are both `singleChoiceOrdinal`, so the type string ALONE cannot tell Configuration 2's two tests apart — only the choice labels can, which makes this the assertion that gives the collision its guard. Asserted as the product's own joined string rather than label-by-label, so a regression in the `', '` join or in the label ORDER reds too.
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

      // W-1, second half — same reasoning as the 5-point sibling above, and this is the assertion that makes the two ordinal tests differ OBSERVABLY from one another rather than only in the payload they handed the mock: seven labels here against the sibling's five, through the same `singleChoiceOrdinal` type string. Note this block runs the `generateTerms` prompt, so it also pins that `{{choices}}` is populated on that template and not only on `generateInfoSections`.
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

      // The three assertions above read only the payload this test handed the mock, so they hold no matter what the product composed. Paired (not replaced) with an assertion about output the PRODUCT built: this question's own choice labels reaching the prompt.
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

      // These deliberately do NOT pin the exact strings this test handed the mock — mock in, mock out asserts nothing about the product, and exact equality on it is already maximal, so it cannot be strengthened in place. They point instead at the only product logic on this path that no other assertion in the file covers — responseTransformer.ts:38-46, which is NOT an identity transform. It RENAMES three provider fields on the way out.
      //
      // NOTE for a later reader: `processingTimeMs` here is NOT a wall-clock measurement, and this is not a `> 0`-on-a-mock decoration. The transformer copies the provider's `latencyMs` verbatim into it, so pinning its exact value asserts a RENAME — product logic. Do not "modernise" this into a `toBeGreaterThan(0)`.
      expect(results[0].llmMetrics.processingTimeMs).toBe(10); // ← llmResponse.latencyMs
      expect(results[0].llmMetrics.nLlmCalls).toBe(1); // ← llmResponse.attempts
      expect(results[0].metadata.modelsUsed).toEqual([mockLLMModel]); // ← llmResponse.response.modelId
    });

    test('composes different prompts for two questions that share a name and differ only in type', async () => {
      // ⚠ This fixture is deliberately NEW, and it is deliberately NOT a pairwise comparison of the three "Configuration" blocks above. Those use three DIFFERENTLY-NAMED questions and the question name is interpolated into the prompt, so comparing their prompts for inequality passes for the wrong reason — it would be a fake guard, which is exactly what this fixture exists to avoid. Holding the question text CONSTANT and varying only `type` is what isolates the property actually under test. Do not "simplify" this back to the existing fixtures.
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

      // The question type must change the prompt. This is what a type-blind composition breaks: if the code reads `question.name` and nothing else, the two prompts are byte-identical.
      expect(booleanPrompt).not.toBe(categoricalPrompt);

      // The answering choices must reach the prompt — the second thing a type-blind composition breaks.
      expect(categoricalPrompt).toContain('Yes, lower it to 16');

      // Supporting, not a primary target: the choices are per-question, so a boolean sibling in the SAME call must not pick up its neighbour's labels. A composition carrying no choices at all would satisfy this one too, which is why the two assertions above carry the weight.
      expect(booleanPrompt).not.toContain('Yes, lower it to 16');
    });
  });

  describe('Prompt composition boundary', () => {
    test('rejects a question that arrives without a type, naming the question', async () => {
      // The boundary guard. `throwIfVarsMissing` CANNOT catch this case: the `questionType` variable is PRESENT, just useless, so the required-param check passes and the prompt renders the literal text `undefined` (measured before the guard was added).
      // A silent degradation wearing the costume of a loud guard is exactly what must not stand here, so the failure is asserted here rather than assumed from the `required` declaration.
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

      // Anchored on purpose. The guard sits OUTSIDE `generateInfo`'s catch, which re-wraps everything it sees as `Error generating question info: ...`; anchoring at `^` is what proves the message arrives intact rather than double-prefixed. It also pins that the failing question is NAMED, so the error is actionable rather than merely loud.
      await expect(generateQuestionInfo({ questions: [untypedQuestion], options })).rejects.toThrow(
        /^\[question-info\] Question 'no-type-1' \("A question that never received a type"\) has no `type`\./
      );

      // And it fails BEFORE reaching the provider — the point of a boundary guard.
      expect(mockLLMProvider.generateObjectParallel).not.toHaveBeenCalled();
    });
  });
});
