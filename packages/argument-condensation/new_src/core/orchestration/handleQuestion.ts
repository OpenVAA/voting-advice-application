import { type HasAnswers } from '@openvaa/core';
import {
  BooleanQuestion,
  QUESTION_TYPE,
  SingleChoiceCategoricalQuestion,
  SingleChoiceOrdinalQuestion
} from '@openvaa/data';
import { LLMProvider } from '@openvaa/llm';
import { Condenser } from '../condenser';
import { PromptRegistry } from '../prompts/promptRegistry';
import {
  CommentGroup,
  CONDENSATION_TYPE,
  CondensationOutputType,
  CondensationRunInput,
  CondensationRunResult,
  MapPrompt,
  ProcessingStep,
  ReducePrompt,
  SupportedQuestion,
  VAAComment
} from '../types';
import { createCondensationSteps, getComments } from '../utils';

/**
 * Main API: Condense arguments for a single question.
 *
 * Takes a question and entities with answers, then runs condensation based on the question type:
 * - Boolean: Generates pros (true) and cons (false) arguments
 * - Ordinal: Generates pros (high values) and cons (low values) arguments
 * - Categorical: Generates pros arguments for each category
 * 
 * @param question - The question to condense arguments for
 * @param entities - The entities with answers
 * @param llmProvider - The LLM provider
 * @param language - The language of the question
 * @param llmModel - The LLM model to use
 * @param runId - The ID of the run
 * @param maxCommentsPerGroup - The maximum number of comments per group
 * @param invertProsAndCons - Whether to invert the pros and cons for ordinal questions
 * @returns The condensation results as an array of CondensationRunResult
 */
export async function handleQuestion({
  question,
  entities,
  llmProvider,
  language,
  llmModel = 'gpt-4o',
  runId = 'default_run_id_if_not_provided',
  maxCommentsPerGroup = 1000,
  invertProsAndCons = false // Only applicable to ordinal questions, rarely needed
}: {
  question: SupportedQuestion;
  entities: Array<HasAnswers>;
  llmProvider: LLMProvider;
  language: string;
  llmModel?: string;
  runId?: string;
  maxCommentsPerGroup?: number;
  invertProsAndCons?: boolean;
}): Promise<Array<CondensationRunResult>> {
  // Separate the comments into argumentation groups (e.g. for tax cuts vs. against tax cuts)
  const commentGroups = getComments({ question, entities, options: { invertProsAndCons } });

  // Check comment group sizes and issue warnings if necessary
  for (const group of commentGroups) {
    const groupDescription =
      group.type === 'categoricalChoice' ? `for choice ${String(group.choiceId)}` : `for ${group.type} arguments`;

    if (group.comments.length < 10) {
      console.warn(
        `Warning: Too few comments for condensation (${group.comments.length} < 10) in group ${groupDescription}. The results may not be meaningful.`
      );
    }
    if (group.comments.length > maxCommentsPerGroup) {
      console.warn(
        `Warning: Too many comments for condensation (${group.comments.length} > ${maxCommentsPerGroup}) in group ${groupDescription}. The list will be truncated to ${maxCommentsPerGroup} comments.`
      );
      group.comments = group.comments.slice(0, maxCommentsPerGroup);
    }
  }

  // Condense arguments for the question
  switch (question.type) {
    case QUESTION_TYPE.Boolean:
      return await handleBooleanQuestion({
        question: question as BooleanQuestion,
        commentGroups,
        llmProvider,
        llmModel,
        language,
        runId,
        maxCommentsPerGroup
      });

    case QUESTION_TYPE.SingleChoiceOrdinal:
      return await handleOrdinalQuestion({
        question: question as SingleChoiceOrdinalQuestion,
        commentGroups,
        llmProvider,
        llmModel,
        language,
        runId,
        maxCommentsPerGroup
      });

    case QUESTION_TYPE.SingleChoiceCategorical:
      return await handleCategoricalQuestion({
        question: question as SingleChoiceCategoricalQuestion,
        commentGroups,
        llmProvider,
        llmModel,
        language,
        runId,
        maxCommentsPerGroup
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
  llmProvider,
  llmModel,
  language,
  runId,
  maxCommentsPerGroup
}: {
  question: BooleanQuestion;
  commentGroups: Array<CommentGroup>;
  llmProvider: LLMProvider;
  llmModel: string;
  language: string;
  runId: string;
  maxCommentsPerGroup: number;
}): Promise<Array<CondensationRunResult>> {
  const results: Array<CondensationRunResult> = [];

  // Condense comments into pros and cons using intelligently filtered comments
  for (const group of commentGroups) {
    if (group.type === 'pro') {
      const prosResult = await runSingleCondensation({
        question,
        comments: group.comments,
        condensationType: CONDENSATION_TYPE.BOOLEAN.PROS,
        llmProvider,
        llmModel,
        language,
        runId,
        maxCommentsPerGroup
      });
      results.push(prosResult);
    } else if (group.type === 'con') {
      const consResult = await runSingleCondensation({
        question,
        comments: group.comments,
        condensationType: CONDENSATION_TYPE.BOOLEAN.CONS,
        llmProvider,
        llmModel,
        language,
        runId,
        maxCommentsPerGroup
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
 */
async function handleOrdinalQuestion({
  question,
  commentGroups,
  llmProvider,
  llmModel,
  language,
  runId,
  maxCommentsPerGroup
}: {
  question: SingleChoiceOrdinalQuestion;
  commentGroups: Array<CommentGroup>;
  llmProvider: LLMProvider;
  llmModel: string;
  language: string;
  runId: string;
  maxCommentsPerGroup: number;
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
        llmProvider,
        llmModel,
        language,
        runId,
        maxCommentsPerGroup
      });
      results.push(prosResult);
    } else if (group.type === 'con') {
      const consResult = await runSingleCondensation({
        question,
        comments: group.comments,
        condensationType: CONDENSATION_TYPE.LIKERT.CONS,
        llmProvider,
        llmModel,
        language,
        runId,
        maxCommentsPerGroup
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
  llmProvider,
  llmModel,
  language,
  runId,
  maxCommentsPerGroup
}: {
  question: SingleChoiceCategoricalQuestion;
  commentGroups: Array<CommentGroup>;
  llmProvider: LLMProvider;
  llmModel: string;
  language: string;
  runId: string;
  maxCommentsPerGroup: number;
}): Promise<Array<CondensationRunResult>> {
  const results: Array<CondensationRunResult> = [];

  // Condense comments into pros for each category
  for (const group of commentGroups) {
    if (group.type === 'categoricalChoice') {
      const categoryResult = await runSingleCondensation({
        question,
        comments: group.comments,
        condensationType: CONDENSATION_TYPE.CATEGORICAL.PROS,
        llmProvider,
        llmModel,
        language,
        runId,
        maxCommentsPerGroup
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
  llmProvider,
  llmModel,
  language,
  runId,
  maxCommentsPerGroup
}: {
  question: SupportedQuestion;
  comments: Array<VAAComment>;
  condensationType: string;
  llmProvider: LLMProvider;
  llmModel: string;
  language: string;
  runId: string;
  maxCommentsPerGroup: number;
}): Promise<CondensationRunResult> {
  // Get prompts from registry
  // TODO: Make configurable - makes it possible to test different prompts (not needed for now)
  // There are two ways to improve configuration: 
  // 1. Take in prompt ids in the handleQuestion function --> we can configure which yaml's prompt to use
  // = providing your own yaml file (with 'promptText' and 'promptId' variables) in the core/prompts folder provides
  // flexibility to test different prompts without further modifications
  // 2. Modify the promptRegistry to be able to load prompts with a different variable than 'promptText' (which is currentlyhardcoded)
  // = you could test different prompts without having to create a new yaml file
  const mapPromptId = `map_${condensationType}_condensation_v1`;
  const reducePromptId = `reduce_${condensationType}_coalescing_v1`;
  const iterationPromptId = `map_${condensationType}_feedback_v1`;

  const promptRegistry = await PromptRegistry.create(language);

  // Get prompts (here it still includes some metadata like the promptId)
  const mapPrompt = promptRegistry.getPrompt(mapPromptId) as MapPrompt;
  const reducePrompt = promptRegistry.getPrompt(reducePromptId) as ReducePrompt;
  const iterationPrompt = promptRegistry.getPrompt(iterationPromptId) as MapPrompt;

  // Check that the required prompts are found. By default we use map-reduce,
  // with a single iteration pass over the map results.
  // If you want to use a custom plan, you need to implement your own steps and own sanity checks here
  if (!mapPrompt || !reducePrompt || !iterationPrompt) {
    throw new Error(`Required prompts not found for condensation type: ${condensationType}`);
  }

  // Get parameters for map-reduce using a helper. 
  // Namely, calculate a sensible 'batchSize' (how many comments to map at a time?) 
  // and 'denominators' (how many argument lists to reduce to one list at a time?).   
  // If you want to use other parameters or operations (like refine or ground), 
  // you must implement your own helper or simply create your own steps here
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
      maxCommentsPerGroup
    }
  };

  // Run condensation
  const condenser = new Condenser(input);
  return await condenser.run();
}