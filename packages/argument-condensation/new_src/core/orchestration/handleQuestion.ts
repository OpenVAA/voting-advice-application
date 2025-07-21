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
  CondensationOperations,
  CondensationOutputType,
  CondensationRunInput,
  CondensationRunResult,
  MapOperationParams,
  MapPrompt,
  ReduceOperationParams,
  ReducePrompt,
  VAAComment
} from '../types';
import { SupportedQuestion } from '../types/base/supportedQuestion';
/**
 * Orchestrates condensation based on question type.
 * Automatically filters comments and runs appropriate condensations.
 */
export async function handleQuestion({
  question,
  comments,
  llmProvider,
  model = 'gpt-4o-mini',
  language = 'en',
  runId = 'question_condensation',
  maxCommentsPerGroup = 50
}): Promise<Array<CondensationRunResult>> {
  switch (question.type) {
    case QUESTION_TYPE.Boolean:
      return await handleBooleanQuestion({
        question: question as BooleanQuestion,
        comments,
        llmProvider,
        model,
        language,
        runId,
        maxCommentsPerGroup
      });

    case QUESTION_TYPE.SingleChoiceOrdinal:
      return await handleOrdinalQuestion({
        question: question as SingleChoiceOrdinalQuestion,
        comments,
        llmProvider,
        model,
        language,
        runId,
        maxCommentsPerGroup
      });

    case QUESTION_TYPE.SingleChoiceCategorical:
      return await handleCategoricalQuestion({
        question: question as SingleChoiceCategoricalQuestion,
        comments,
        llmProvider,
        model,
        language,
        runId,
        maxCommentsPerGroup
      });

    default:
      throw new Error(`Unsupported question type: ${(question as unknown as { type: string }).type}`);
  }
}

async function handleBooleanQuestion({
  question,
  comments,
  llmProvider,
  model,
  language,
  runId,
  maxCommentsPerGroup
}: {
  question: BooleanQuestion;
  comments: Array<VAAComment>;
  llmProvider: LLMProvider;
  model: string;
  language: string;
  runId: string;
  maxCommentsPerGroup: number;
}): Promise<Array<CondensationRunResult>> {
  // Filter comments for TRUE (pros) and FALSE (cons)
  const trueComments = comments.filter((c) => c.candidateAnswer === 'true' || c.candidateAnswer === 1);
  const falseComments = comments.filter((c) => c.candidateAnswer === 'false' || c.candidateAnswer === 0);

  const results: Array<CondensationRunResult> = [];

  // Run condensation for TRUE answers (pros)
  if (trueComments.length > 0) {
    const selectedTrueComments = trueComments.slice(0, Math.min(maxCommentsPerGroup, trueComments.length));
    const prosResult = await runSingleCondensation({
      question,
      comments: selectedTrueComments,
      condensationType: CONDENSATION_TYPE.BOOLEAN.PROS,
      llmProvider,
      model,
      language,
      runId,
      maxCommentsPerGroup
    });

    results.push(prosResult);
  }

  // Run condensation for FALSE answers (cons)
  if (falseComments.length > 0) {
    const selectedFalseComments = falseComments.slice(0, Math.min(maxCommentsPerGroup, falseComments.length));
    const consResult = await runSingleCondensation({
      question,
      comments: selectedFalseComments,
      condensationType: CONDENSATION_TYPE.BOOLEAN.CONS,
      llmProvider,
      model,
      language,
      runId,
      maxCommentsPerGroup
    });

    results.push(consResult);
  }

  return results;
}

async function handleOrdinalQuestion({
  question,
  comments,
  llmProvider,
  model,
  language,
  runId,
  maxCommentsPerGroup
}: {
  question: SingleChoiceOrdinalQuestion;
  comments: Array<VAAComment>;
  llmProvider: LLMProvider;
  model: string;
  language: string;
  runId: string;
  maxCommentsPerGroup: number;
}): Promise<Array<CondensationRunResult>> {
  // Detect scale from comments
  const numericAnswers = comments.map((c) => Number(c.candidateAnswer)).filter((n) => !isNaN(n));

  if (numericAnswers.length === 0) {
    return [];
  }

  const results: Array<CondensationRunResult> = [];

  const minValue = Math.min(...numericAnswers);
  const maxValue = Math.max(...numericAnswers);
  const midpoint = (minValue + maxValue) / 2;

  // Filter for high values (pros) and low values (cons)
  const prosComments = comments.filter((c) => {
    const value = Number(c.candidateAnswer);
    return !isNaN(value) && value > midpoint;
  });

  const consComments = comments.filter((c) => {
    const value = Number(c.candidateAnswer);
    return !isNaN(value) && value < midpoint;
  });

  // Run condensation for high values (pros)
  if (prosComments.length > 0) {
    const selectedProsComments = prosComments.slice(0, Math.min(maxCommentsPerGroup, prosComments.length));
    const prosResult = await runSingleCondensation({
      question,
      comments: selectedProsComments,
      condensationType: CONDENSATION_TYPE.LIKERT.PROS,
      llmProvider,
      model,
      language,
      runId,
      maxCommentsPerGroup
    });

    results.push(prosResult);
  }

  // Run condensation for low values (cons)
  if (consComments.length > 0) {
    const selectedConsComments = consComments.slice(0, Math.min(maxCommentsPerGroup, consComments.length));
    const consResult = await runSingleCondensation({
      question,
      comments: selectedConsComments,
      condensationType: CONDENSATION_TYPE.LIKERT.CONS,
      llmProvider,
      model,
      language,
      runId,
      maxCommentsPerGroup
    });

    results.push(consResult);
  }

  return results;
}

async function handleCategoricalQuestion({
  question,
  comments,
  llmProvider,
  model,
  language,
  runId,
  maxCommentsPerGroup
}: {
  question: SingleChoiceCategoricalQuestion;
  comments: Array<VAAComment>;
  llmProvider: LLMProvider;
  model: string;
  language: string;
  runId: string;
  maxCommentsPerGroup: number;
}): Promise<Array<CondensationRunResult>> {
  // Get unique category values from comments
  const uniqueAnswers = [...new Set(comments.map((c) => c.candidateAnswer))];

  const results: Array<CondensationRunResult> = [];

  // Run condensation for each category
  for (const categoryValue of uniqueAnswers) {
    const categoryComments = comments.filter((c) => c.candidateAnswer === categoryValue);

    if (categoryComments.length > 0) {
      const selectedComments = categoryComments.slice(0, Math.min(maxCommentsPerGroup, categoryComments.length));
      const categoryResult = await runSingleCondensation({
        question,
        comments: selectedComments,
        condensationType: CONDENSATION_TYPE.CATEGORICAL.PROS,
        llmProvider,
        model,
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
  model,
  language,
  runId,
  maxCommentsPerGroup
}: {
  question: SupportedQuestion;
  comments: Array<VAAComment>;
  condensationType: string;
  llmProvider: LLMProvider;
  model: string;
  language: string;
  runId: string;
  maxCommentsPerGroup: number;
}): Promise<CondensationRunResult> {
  // Get prompts from registry
  const mapPromptId = `map_${condensationType}_condensation_v1`;
  const reducePromptId = `reduce_${condensationType}_coalescing_v1`;
  const iterationPromptId = `map_${condensationType}_feedback_v1`;

  const promptRegistry = await PromptRegistry.create(language);

  const mapPrompt = promptRegistry.getPrompt(mapPromptId) as MapPrompt;
  const reducePrompt = promptRegistry.getPrompt(reducePromptId) as ReducePrompt;
  const iterationPrompt = promptRegistry.getPrompt(iterationPromptId) as MapPrompt;

  if (!mapPrompt || !reducePrompt || !iterationPrompt) {
    throw new Error(`Required prompts not found for condensation type: ${condensationType}`);
  }

  // Create condensation plan
  const config = {
    outputType: condensationType as CondensationOutputType,
    steps: [
      {
        operation: CondensationOperations.MAP,
        params: {
          batchSize: mapPrompt.params.batchSize,
          condensationPrompt: mapPrompt.promptText,
          iterationPrompt: iterationPrompt.promptText
        } as MapOperationParams
      },
      {
        operation: CondensationOperations.REDUCE,
        params: {
          denominator: reducePrompt.params.denominator,
          coalescingPrompt: reducePrompt.promptText
        } as ReduceOperationParams
      }
    ],
    nOutputArgs: 3,
    language
  };

  // Create condensation input
  const input: CondensationRunInput = {
    question,
    comments,
    options: {
      model,
      language,
      runId,
      llmProvider,
      processingSteps: config.steps,
      outputType: condensationType as CondensationOutputType,
      maxCommentsPerGroup
    }
  };

  // Run condensation
  const condenser = new Condenser(input);
  return await condenser.run();
}
