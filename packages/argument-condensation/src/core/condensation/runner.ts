import { Condenser } from './condenser';
import { MODEL_DEFAULTS } from '../../defaultValues';
import { createCondensationSteps } from '../utils';
import type {
  CondensationAPIOptions,
  CondensationOutputType,
  CondensationRunInput,
  CondensationRunResult,
  ProcessingStep,
  SupportedQuestion,
  VAAComment
} from '../types';

/**
 * Condense arguments for a single group of comments.
 * A question usually has multiple groups of comments (e.g. pro and con comment groups for boolean and likert questions),
 * so this function is called multiple times for a single question.
 * Condensation type determines both the input and output type. First level is question type (input), second level is output type.
 * E.g. CONDENSATION_TYPE.BooleanPros is a boolean question with pros as output.
 *
 * @param {object} - args - The arguments object.
 * @param {SupportedQuestion} - args.question - The question to condense arguments for.
 * @param {Array<VAAComment>} - args.comments - The comments to condense.
 * @param {CondensationOutputType} - args.condensationType - The type of condensation to perform.
 * @param {CondensationAPIOptions} - args.options - The configuration options for condensation.
 * @param {number} - args.parallelBatches - The number of parallel batches to use for condensation.
 * @returns {Promise<CondensationRunResult>} The condensation results as a CondensationRunResult.
 *
 * @example
 * const results = await runSingleCondensation({
 *   question: question as BooleanQuestion,
 *   comments: Array<VAAComment>,
 *   condensationType: CONDENSATION_TYPE.BooleanPros,
 *   options: {
 *     llmProvider: new LLMProvider({ provider: 'openai', apiKey: '...', modelConfig: { primary: 'gpt-4o' } }),
 *     language: 'en',
 *     llmModel: 'gpt-4o',
 *     runId: 'example-run-id',
 *     maxCommentsPerGroup: 1000,
 *     modelTPMLimit: 30000
 *   },
 *   parallelBatches: 1
 * });
 */
export async function runSingleCondensation({
  question,
  comments,
  condensationType,
  options,
  parallelBatches
}: {
  question: SupportedQuestion;
  comments: Array<VAAComment>;
  condensationType: CondensationOutputType;
  options: CondensationAPIOptions;
  parallelBatches: number;
}): Promise<CondensationRunResult> {
  const { llmProvider, language, runId, createVisualizationData, prompts } = options;
  const modelTPMLimit = llmProvider.config.modelConfig.tpmLimit ?? MODEL_DEFAULTS.TPM_LIMIT;
  // Get prompts from registry
  // If you are interested in testing different prompts, you can:
  //  - Set your own prompts in src/core/prompts/.../yourPrompt.yaml files with a promptText variable holding your prompts.
  //   This will make it available to use in the handleQuestion function with the 'prompts' by configuring your own promptIds.

  const promptsForType = prompts?.[condensationType];
  const mapPromptId = promptsForType?.map ?? `map_${condensationType}_condensation_v1`;
  const reducePromptId = promptsForType?.reduce ?? `reduce_${condensationType}_coalescing_v1`;
  const iterationPromptId = promptsForType?.mapIteration ?? `map_${condensationType}_iterate_v1`;

  // Get prompts and their required parameters using a helper. Currently hardcoded to use map-reduce with specific prompts.
  // The helper calculates a sensible 'batchSize' (how many comments to map at a time?) for the map operation.
  // For reduce, it finds 'denominators' (how many argument lists to coalesce to one list at a time?).
  // If you want to use other parameters or operations (like refine or ground),
  // you must implement your own helper logic or simply configure your own steps here with consts
  const steps: Array<ProcessingStep> = await createCondensationSteps({
    comments,
    mapPromptId,
    mapIterationPromptId: iterationPromptId,
    reducePromptId,
    language,
    questionName: question.name,
    parallelFactor: parallelBatches,
    modelTPMLimit,
    controller: options.controller
  });

  // Create condensation input that defines all inputs and the configuration for the condenser,
  // which is the condensation logic engine that orchestrates LLM calls and their parsing
  const input: CondensationRunInput = {
    question,
    comments,
    options: {
      language,
      runId,
      llmProvider,
      processingSteps: steps,
      outputType: condensationType as CondensationOutputType,
      parallelBatches,
      createVisualizationData: createVisualizationData ?? false, // For the linter... set already in handleQuestion
      controller: options.controller
    }
  };

  // Run condensation
  const condenser = new Condenser(input);
  return await condenser.run();
}
