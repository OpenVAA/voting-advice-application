import { PromptRegistry } from '../prompts/promptRegistry';
import { CondensationOperations, MapOperationParams, ProcessingStep, ReduceOperationParams } from '../types';
import { MapPrompt, ReducePrompt } from '../types/llm/prompt';

/**
 * Defines the steps for a condensation operation based on the number of comments.
 * This function dynamically calculates the optimal batch size for the MAP step
 * and the optimal denominator for each REDUCE step to ensure efficient processing.
 *
 * @param totalComments - The total number of comments to be processed.
 * @param mapPromptId - The ID for the map prompt.
 * @param mapIterationPromptId - The ID for the map iteration prompt.
 * @param reducePromptId - The ID for the reduce prompt.
 * @param language - The language for the prompts.
 * @returns An array of processing steps for the condensation operation.
 */
export async function createCondensationSteps(
  totalComments: number,
  mapPromptId: string,
  mapIterationPromptId: string,
  reducePromptId: string,
  language: string
): Promise<Array<ProcessingStep>> {
  const promptRegistry = await PromptRegistry.create(language);

  const mapPrompt = promptRegistry.getPrompt(mapPromptId) as MapPrompt;
  const mapIterationPrompt = promptRegistry.getPrompt(mapIterationPromptId) as MapPrompt;
  const reducePrompt = promptRegistry.getPrompt(reducePromptId) as ReducePrompt;

  // --- Dynamic Calculation of Batch Size and Denominators ---

  // 1. Determine MAP batchSize
  const MAX_BATCH_SIZE = 30;
  const MIN_INITIAL_BATCHES = 4; // Target at least this many batches after MAP
  let batchSize: number;

  // If the total number of comments is greater than or equal to the maximum batch size,
  // use the maximum batch size. Otherwise, use minimum initial batches
  if (totalComments / MAX_BATCH_SIZE >= MIN_INITIAL_BATCHES) {
    batchSize = MAX_BATCH_SIZE;
  } else {
    batchSize = Math.floor(totalComments / MIN_INITIAL_BATCHES);
  }
  batchSize = Math.max(1, batchSize); // Ensure batch size is at least 1
  
  const processingSteps: Array<ProcessingStep> = [
    {
      operation: CondensationOperations.MAP,
      params: {
        batchSize,
        condensationPrompt: mapPrompt.promptText,
        iterationPrompt: mapIterationPrompt.promptText
      } as MapOperationParams
    }
  ];

  // 2. Determine REDUCE denominators
  let numArgumentLists = Math.ceil(totalComments / batchSize);
  const MAX_DENOMINATOR = 6;
  const MIN_DENOMINATOR = 2;

  while (numArgumentLists > 1) {
    let denominator = Math.min(numArgumentLists, MAX_DENOMINATOR);
    // Ensure denominator is at least 2 if there are lists to reduce
    if (numArgumentLists > 1) {
      denominator = Math.max(denominator, MIN_DENOMINATOR);
    }

    processingSteps.push({
      operation: CondensationOperations.REDUCE,
      params: {
        denominator,
        coalescingPrompt: reducePrompt.promptText
      } as ReduceOperationParams
    });

    numArgumentLists = Math.ceil(numArgumentLists / denominator);
  }

  return processingSteps;
}
