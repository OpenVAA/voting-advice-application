import { type HasAnswers } from '@openvaa/core';
import {
  BooleanQuestion,
  QUESTION_TYPE,
  SingleChoiceCategoricalQuestion,
  SingleChoiceOrdinalQuestion
} from '@openvaa/data';
import { Condenser } from './core/condensation/condenser';
import {
  CommentGroup,
  CONDENSATION_TYPE,
  CondensationAPIOptions,
  CondensationOutputType,
  CondensationRunInput,
  CondensationRunResult,
  ProcessingStep,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  SupportedQuestion,
  VAAComment
} from './core/types';
import { createCondensationSteps, getAndSliceComments, getParallelFactor } from './core/utils';

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
 * @param llmProvider - The LLM provider: an abstract to-implement class for provider-agnostic LLM calls
 * @param language - The language of the question and entity answers
 * @param llmModel - The LLM model to use
 * @param modelTPMLimit - The number of tokens per minute the LLM model can handle
 * @param runId - The ID of the run: useful for tracking and visualizing multiple runs
 * @param maxCommentsPerGroup - The maximum number of comments per group
 * @param invertProsAndCons - Whether to invert the pros and cons for ordinal questions (rarely needed)
 * @returns The condensation results as an array of CondensationRunResult
 *
 * @example
 * // 1. Set up your question, entities, and LLM provider
 * // See types/base/supportedQuestion.ts for the supported question types.
 *
 * const question = {
 *   id: 'q1',
 *   type: 'boolean',
 *   text: {
 *     en: 'Should the government increase funding for renewable energy?'
 *   }
 * };
 *
 * const entities: Array<HasAnswers> = [ // HasAnswers can be any entity with answers to the question: candidates, parties, etc.
 *   {
 *     id: 'c1',
 *     answers: { 'q1': { value: true, comment: 'Absolutely, it is crucial for the future of our planet.' } }
 *   },
 *   {
 *     id: 'c2',
 *     answers: { 'q1': { value: false, comment: 'No, we should prioritize economic growth and traditional energy sectors.' } }
 *   }
 * ];
 *
 * const llmProvider = new OpenAIProvider({ apiKey: '...' });
 *
 * // 2. Call handleQuestion with the setup
 * const results = await handleQuestion({
 *   question,
 *   entities,
 *   llmProvider,
 *   language: 'en', // or 'fi'
 *   llmModel: 'gpt-4o',
 *   runId: 'some-run-id',
 *   maxCommentsPerGroup: 1000,
 *   invertProsAndCons: false
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
  // Set default values for optional parameters 
  const options = {
    ...userOptions,
    createVisualizationData: userOptions.createVisualizationData ?? false, 
    modelTPMLimit: userOptions.modelTPMLimit ?? 30000, // A conservative limit for low-TPM models of OpenAI (8/25)
    invertProsAndCons: userOptions.invertProsAndCons ?? false, // Rarely needed
  }

  // Destructure for easier use
  const { language, maxCommentsPerGroup, modelTPMLimit, invertProsAndCons } = options;

  // Check that the language is supported
  if (!SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) {
    throw new Error(
      `Unsupported language: ${language}. Please use a supported language: ` + SUPPORTED_LANGUAGES.join(', ')
    );
  }

  // Separate the comments into argumentation groups (e.g. for tax cuts vs. against tax cuts)
  const commentGroups = getAndSliceComments({ question, entities, options: { invertProsAndCons, maxCommentsPerGroup } });

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

/**
 * Condense arguments for a boolean question.
 * Generates pros (true) and cons (false) arguments using separate condensation runs & different comments
 *
 * @param question - The question to condense arguments for
 * @param commentGroups - The comment groups to condense
 * @param llmProvider - The LLM provider
 * @param llmModel - The LLM model to use
 * @param language - The language of the question
 * @param runId - The ID of the run
 * @param maxCommentsPerGroup - The maximum number of comments per group
 */
async function handleBooleanQuestion({
  question,
  commentGroups,
  options,
  parallelBatches
}: {
  question: BooleanQuestion;
  commentGroups: Array<CommentGroup>;
  options: CondensationAPIOptions;
  parallelBatches: number;
}): Promise<Array<CondensationRunResult>> {
  const results: Array<CondensationRunResult> = [];

  // Condense comments into pros and cons using intelligently filtered comments
  for (const group of commentGroups) {
    if (group.type === 'pro') {
      const prosResult = await runSingleCondensation({
        question,
        comments: group.comments,
        condensationType: CONDENSATION_TYPE.BOOLEAN.PROS,
        options: { ...options, runId: options.runId + '-pros' },
        parallelBatches
      });
      results.push(prosResult);
    } else if (group.type === 'con') {
      const consResult = await runSingleCondensation({
        question,
        comments: group.comments,
        condensationType: CONDENSATION_TYPE.BOOLEAN.CONS,
        options: { ...options, runId: options.runId + '-cons' },
        parallelBatches
      });
      results.push(consResult);
    }
  }

  return results;
}

/**
 * Condense arguments for an ordinal question.
 * Generates pros (high values) and cons (low values) arguments using separate condensation runs & different comments
 *
 * @param question - The question to condense arguments for
 * @param commentGroups - The comment groups to condense
 * @param llmProvider - The LLM provider
 * @param llmModel - The LLM model to use
 * @param language - The language of the question
 * @param runId - The ID of the run
 * @param maxCommentsPerGroup - The maximum number of comments per group
 * @param parallelBatches - The number of parallel batches to use
 * @param modelTPMLimit - The number of tokens per minute the LLM model can handle
 */
async function handleOrdinalQuestion({
  question,
  commentGroups,
  options,
  parallelBatches
}: {
  question: SingleChoiceOrdinalQuestion;
  commentGroups: Array<CommentGroup>;
  options: CondensationAPIOptions;
  parallelBatches: number;
}): Promise<Array<CondensationRunResult>> {
  const results: Array<CondensationRunResult> = [];

  // Condense comments into pros and cons using comments that have been chosen by their answer value
  // E.g. for likert-5: use low-scale (1-2) for cons, high-scale (4-5) for pros
  for (const group of commentGroups) {
    if (group.type === 'pro') {
      const prosResult = await runSingleCondensation({
        question,
        comments: group.comments,
        condensationType: CONDENSATION_TYPE.LIKERT.PROS,
        options: { ...options, runId: options.runId + '-pros' },
        parallelBatches
      });
      results.push(prosResult);
    } else if (group.type === 'con') {
      const consResult = await runSingleCondensation({
        question,
        comments: group.comments,
        condensationType: CONDENSATION_TYPE.LIKERT.CONS,
        options: { ...options, runId: options.runId + '-cons' },
        parallelBatches
      });
      results.push(consResult);
    }
  }

  return results;
}

/**
 * Condense arguments for a categorical question.
 * Generates pros arguments for each category using separate condensation runs.
 * Uses category X's comments exclusively to find pros for category X
 *
 * @param question - The question to condense arguments for
 * @param commentGroups - The comment groups to condense
 * @param llmProvider - The LLM provider
 * @param llmModel - The LLM model to use
 * @param language - The language of the question
 * @param runId - The ID of the run
 * @param maxCommentsPerGroup - The maximum number of comments per group
 */
async function handleCategoricalQuestion({
  question,
  commentGroups,
  options,
  parallelBatches
}: {
  question: SingleChoiceCategoricalQuestion;
  commentGroups: Array<CommentGroup>;
  options: CondensationAPIOptions;
  parallelBatches: number;
}): Promise<Array<CondensationRunResult>> {
  const results: Array<CondensationRunResult> = [];

  // Condense comments into pros for each category
  for (const group of commentGroups) {
    if (group.type === 'categoricalChoice') {
      const categoryResult = await runSingleCondensation({
        question,
        comments: group.comments,
        condensationType: CONDENSATION_TYPE.CATEGORICAL.PROS,
        options: { ...options, runId: options.runId + group.choiceId },
        parallelBatches
      });
      results.push(categoryResult);
    }
  }

  return results;
}

/**
 * Condense arguments for a single group of comments.
 * A question usually has multiple groups of comments (e.g. pro and con comment groups for boolean and likert questions),
 * so this function is called multiple times for a single question.
 * Condensation type determines both the input and output type. First level is question type (input), second level is output type.
 * E.g. CONDENSATION_TYPE.BOOLEAN.PROS is a boolean question with pros as output.
 *
 * @param question - The question to condense arguments for
 * @param comments - The comments to condense
 * @param condensationType - The type of condensation to perform
 * @param llmProvider - The LLM provider
 * @param llmModel - The LLM model to use
 * @param language - The language of the question
 * @param runId - The ID of the run
 * @param maxCommentsPerGroup - The maximum number of comments per group
 * @returns The condensation results as a CondensationRunResult
 *
 * @example
 * const results = await runSingleCondensation({
 *   question: question as BooleanQuestion,
 *   comments: Array<VAAComment>,
 *   condensationType: CONDENSATION_TYPE.BOOLEAN.PROS,
 *   llmProvider: OpenAIProvider,
 *   llmModel: 'gpt-4o',
 *   language: 'en',
 *   runId: 'example-run-id',
 *   maxCommentsPerGroup: 1000,
 * });
 */
async function runSingleCondensation({
  question,
  comments,
  condensationType,
  options,
  parallelBatches
}: {
  question: SupportedQuestion;
  comments: Array<VAAComment>;
  condensationType: string;
  options: CondensationAPIOptions;
  parallelBatches: number;
}): Promise<CondensationRunResult> {
  const { llmProvider, llmModel, language, runId, modelTPMLimit, createVisualizationData } = options;
  // Get prompts from registry
  // If you are interested in testing different prompts, there are two ways to improve configuration:
  // 1. Take in prompt ids in the handleQuestion function --> you can choose which yaml's prompt to use (hardcoded for now)
  // --> providing your own yaml file (with 'promptText' and 'promptId' variables) in the core/prompts folder makes a prompt easily available
  // 2. Modify the promptRegistry to load prompts with a different variable than just 'promptText' (which is currently hardcoded)
  // --> you could test different prompts without having to create a new yaml file, simply adding a new variable in a current yaml file
  // with a specific promptId would suffice (of course you would have to specify somehow which prompt to use from the yaml file)
  const mapPromptId = `map_${condensationType}_condensation_v1`;
  const reducePromptId = `reduce_${condensationType}_coalescing_v1`;
  const iterationPromptId = `map_${condensationType}_iterate_v1`;

  // Get prompts and their required parameters using a helper. Currently hardcoded to use map-reduce with specific prompts.
  // The helper calculates a sensible 'batchSize' (how many comments to map at a time?) for the map operation.
  // For reduce, it finds 'denominators' (how many argument lists to coalesce to one list at a time?).
  // If you want to use other parameters or operations (like refine or ground),
  // you must implement your own helper logic or simply configure your own steps here with consts
  const steps: Array<ProcessingStep> = await createCondensationSteps({
    totalComments: comments.length,
    mapPromptId,
    mapIterationPromptId: iterationPromptId,
    reducePromptId,
    language
  });

  // Create condensation input that defines all inputs and the configuration for the condenser,
  // which is the condensation logic engine that orchestrates LLM calls and their parsing
  const input: CondensationRunInput = {
    question,
    comments,
    options: {
      llmModel,
      language,
      runId,
      llmProvider,
      processingSteps: steps,
      outputType: condensationType as CondensationOutputType,
      parallelBatches,
      modelTPMLimit,
      createVisualizationData: createVisualizationData ?? false // For the linter... set already in handleQuestion
    }
  };

  // Run condensation
  const condenser = new Condenser(input);
  return await condenser.run();
}
