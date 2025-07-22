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
  CONDENSATION_TYPE,
  CondensationOutputType,
  CondensationRunInput,
  CondensationRunResult,
  MapPrompt,
  ProcessingStep,
  ReducePrompt,
  VAAComment
} from '../types';
import { CommentGroup } from '../types/api/commentGroup';
import { SupportedQuestion } from '../types/base/supportedQuestion';
import { createCondensationSteps } from '../utils/defineCondensationSteps';
import { getComments } from '../utils/getComments';

/**
 * Main API: Condense arguments for a single question.
 *
 * Takes a question and entities with answers, then runs condensation based on the question type:
 * - Boolean: Generates pros (true) and cons (false) arguments
 * - Ordinal: Generates pros (high values) and cons (low values) arguments
 * - Categorical: Generates pros arguments for each category
 */
export async function handleQuestion({
  question,
  entities,
  llmProvider,
  language,
  llmModel = 'gpt-4o',
  runId = 'default_run_id_if_not_provided',
  maxCommentsPerGroup = 200,
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
  switch (question.type) {
    case QUESTION_TYPE.Boolean:
      return await handleBooleanQuestion({
        question: question as BooleanQuestion,
        entities,
        llmProvider,
        llmModel,
        language,
        runId,
        maxCommentsPerGroup
      });

    case QUESTION_TYPE.SingleChoiceOrdinal:
      return await handleOrdinalQuestion({
        question: question as SingleChoiceOrdinalQuestion,
        entities,
        llmProvider,
        llmModel,
        language,
        runId,
        maxCommentsPerGroup,
        invertProsAndCons // Ordinal questions may have an inverted scale
      });

    case QUESTION_TYPE.SingleChoiceCategorical:
      return await handleCategoricalQuestion({
        question: question as SingleChoiceCategoricalQuestion,
        entities,
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
 * Generates pros (true) and cons (false) arguments.
 */
async function handleBooleanQuestion({
  question,
  entities,
  llmProvider,
  llmModel,
  language,
  runId,
  maxCommentsPerGroup
}: {
  question: BooleanQuestion;
  entities: Array<HasAnswers>;
  llmProvider: LLMProvider;
  llmModel: string;
  language: string;
  runId: string;
  maxCommentsPerGroup: number;
}): Promise<Array<CondensationRunResult>> {
  // Extract comments
  const commentGroups: Array<CommentGroup> = getComments(question, entities);

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
 * Generates pros (high values) and cons (low values) arguments.
 */
async function handleOrdinalQuestion({
  question,
  entities,
  llmProvider,
  llmModel,
  language,
  runId,
  maxCommentsPerGroup,
  invertProsAndCons
}: {
  question: SingleChoiceOrdinalQuestion;
  entities: Array<HasAnswers>;
  llmProvider: LLMProvider;
  llmModel: string;
  language: string;
  runId: string;
  maxCommentsPerGroup: number;
  invertProsAndCons: boolean;
}): Promise<Array<CondensationRunResult>> {
  // Get approapriate comments for this condensation process
  const commentGroups = getComments(question, entities, { invertProsAndCons });

  const results: Array<CondensationRunResult> = [];

  // Condense comments into pros and cons using intelligently filtered comments
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
 * Generates pros arguments for each category.
 */
async function handleCategoricalQuestion({
  question,
  entities,
  llmProvider,
  llmModel,
  language,
  runId,
  maxCommentsPerGroup
}: {
  question: SingleChoiceCategoricalQuestion;
  entities: Array<HasAnswers>;
  llmProvider: LLMProvider;
  llmModel: string;
  language: string;
  runId: string;
  maxCommentsPerGroup: number;
}): Promise<Array<CondensationRunResult>> {
  // Extract comments
  const commentGroups = getComments(question, entities);

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
  // TODO: Make configurable - makes it possible to test different prompts
  const mapPromptId = `map_${condensationType}_condensation_v1`;
  const reducePromptId = `reduce_${condensationType}_coalescing_v1`;
  const iterationPromptId = `map_${condensationType}_feedback_v1`;

  const promptRegistry = await PromptRegistry.create(language);

  // TODO: clean up getting prompts from registry
  const mapPrompt = promptRegistry.getPrompt(mapPromptId) as MapPrompt;
  const reducePrompt = promptRegistry.getPrompt(reducePromptId) as ReducePrompt;
  const iterationPrompt = promptRegistry.getPrompt(iterationPromptId) as MapPrompt;

  // TODO: depends on the plan which prompts are needed
  if (!mapPrompt || !reducePrompt || !iterationPrompt) {
    throw new Error(`Required prompts not found for condensation type: ${condensationType}`);
  }

  // Create condensation plan
  // TODO: implement actual calculation of batch size and denominator (defaults to Map-Reduce)
  const steps: Array<ProcessingStep> = await createCondensationSteps(mapPromptId, iterationPromptId, reducePromptId, language);

  // Create condensation input
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