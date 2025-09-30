import { BaseController, type HasAnswers } from '@openvaa/core';
import { QUESTION_TYPE } from '@openvaa/data';
import { SUPPORTED_LANGUAGES } from './core/types';
import { getAndSliceComments, getParallelFactor } from './core/utils';
import { MODEL_DEFAULTS } from './defaultValues';
import { handleBooleanQuestion, handleCategoricalQuestion, handleOrdinalQuestion } from './question-handlers';
import type { BooleanQuestion, SingleChoiceCategoricalQuestion, SingleChoiceOrdinalQuestion } from '@openvaa/data';
import type {
  CommentGroupingOptions,
  CondensationAPIOptions,
  CondensationRunResult,
  SupportedLanguage,
  SupportedQuestion
} from './core/types';
/**
 * Main API: Condense arguments for a single question.
 *
 * Takes a question and entities with answers, then runs condensation based on the question type:
 * - Boolean: Generates pros (true) and cons (false) arguments
 * - Ordinal: Generates pros (high values) and cons (low values) arguments
 * - Categorical: Generates pros arguments for each category
 *
 * @param question - The question to condense arguments for
 * @param entities - The entity objects (e.g. candidates or parties) with an 'answers' property
 * @param options - Configuration options including:
 * @param options.llmProvider - The LLM provider: an abstract to-implement class for provider-agnostic LLM calls
 * @param options.language - The language of the question and entity answers
 * @param options.llmModel - The LLM model to use
 * @param options.modelTPMLimit - The number of tokens per minute the LLM model can handle
 * @param options.runId - The ID of the run: useful for tracking and visualizing multiple runs
 * @param options.maxCommentsPerGroup - The maximum number of comments per group
 * @param options.invertProsAndCons - Whether to invert the pros and cons for ordinal questions (rarely needed)
 * @param options.createVisualizationData - Whether to create visualization data for the condensation process
 * @param options.prompts - Optional promptsIds if your language is inherently supported.
 * @param options.controller - Optional controller for tracking progress and issues during condensation
 * @returns The condensation results as an array of CondensationRunResult
 *
 * @example
 * import { handleQuestion } from '@openvaa/argument-condensation';
 * import { BooleanQuestion, DataRoot, QUESTION_TYPE } from '@openvaa/data';
 * import { LLMProvider } from '@openvaa/llm-refactor';
 * import type { HasAnswers } from '@openvaa/core';
 *
 * // 1. Set up your question, entities, and LLM provider
 * // You'll most likely get the question from the DataRoot
 * const question = new BooleanQuestion({
 *   data: {
 *     id: 'q1',
 *     type: QUESTION_TYPE.Boolean,
 *     name: 'Renewable Energy Funding',
 *     customData: {},
 *     categoryId: 'cat1'
 *   },
 *   root: dataRoot // Your DataRoot instance
 * });
 *
 * const entities: Array<HasAnswers> = [
 *   {
 *     id: 'c1',
 *     answers: { q1: { value: true, comment: 'Absolutely, it is crucial for the future of our planet.' } }
 *   },
 *   {
 *     id: 'c2',
 *     answers: {
 *       q1: { value: false, comment: 'No, we should prioritize economic growth and traditional energy sectors.' }
 *     }
 *   },
 *   {
 *     id: 'c3',
 *     answers: { q1: { value: true, comment: 'Yes, and we should also invest in job training for green energy fields.' } }
 *   }
 * ];
 *
 * const llmProvider = new LLMProvider({ provider: 'openai', apiKey: '...', modelConfig: { primary: 'gpt-4o' } });
 *
 * // 2. Call handleQuestion with the setup
 * const results = await handleQuestion({
 *   question,
 *   entities,
 *   options: {
 *     llmProvider,
 *     language: 'en',
 *     llmModel: 'gpt-4o',
 *     modelTPMLimit: 30000,
 *     runId: 'some-run-id',
 *     maxCommentsPerGroup: 1000,
 *     invertProsAndCons: false,
 *     prompts: {}
 *     // Optional controller
 *   }
 * });
 */
export async function handleQuestion({
  question,
  entities,
  options: userOptions
}: {
  question: SupportedQuestion;
  entities: Array<HasAnswers>;
  options: CondensationAPIOptions;
}): Promise<Array<CondensationRunResult>> {
  // Set default values for some optional parameters
  // Default promptIds and the visualization flag (false) are set in runSingleCondensation
  const options = {
    ...userOptions,
    modelTPMLimit: userOptions.modelTPMLimit ?? MODEL_DEFAULTS.TPM_LIMIT, // A conservative limit for low-TPM models of OpenAI (8/25)
    invertProsAndCons: userOptions.invertProsAndCons ?? false, // Rarely needed
    controller: userOptions.controller ?? new BaseController() // Default controller for progress and issue tracking
  };

  // Destructure for easier use
  const { language, maxCommentsPerGroup, modelTPMLimit, invertProsAndCons } = options;

  // Check that the language is supported
  if (!SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) {
    throw new Error(
      `Unsupported language: ${language}. Please use a supported language: ` + SUPPORTED_LANGUAGES.join(', ')
    );
  }

  // Separate the comments into argumentation groups (e.g. for tax cuts vs. against tax cuts)
  const commentGroups = getAndSliceComments({
    question,
    entities,
    options: { invertProsAndCons, maxCommentsPerGroup, controller: options.controller } as CommentGroupingOptions
  });

  // Calculate a reasonable number of parallel batches based on the LLM model's TPM limit
  const parallelBatches = getParallelFactor(modelTPMLimit);

  // Condense arguments for the question
  switch (question.type) {
    case QUESTION_TYPE.Boolean:
      return await handleBooleanQuestion({
        question: question as BooleanQuestion,
        commentGroups,
        options,
        parallelBatches
      });

    case QUESTION_TYPE.SingleChoiceOrdinal:
      return await handleOrdinalQuestion({
        question: question as SingleChoiceOrdinalQuestion,
        commentGroups,
        options,
        parallelBatches
      });

    case QUESTION_TYPE.SingleChoiceCategorical:
      return await handleCategoricalQuestion({
        question: question as SingleChoiceCategoricalQuestion,
        commentGroups,
        options,
        parallelBatches
      });

    // Should never happen if the supportedQuestion type is updated correctly
    default:
      throw new Error(`Unsupported question type: ${(question as unknown as { type: string }).type}`);
  }
}
