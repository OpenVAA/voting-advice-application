import { BaseController } from '@openvaa/core';
import { createBatches } from './createBatches';
import { validateInputTokenCount } from './validateInputTokenCount';
import { BATCH_PROCESSING } from '../../../defaultValues';
import { PromptRegistry } from '../../condensation/prompts/promptRegistry';
import { CondensationOperations } from '../../types';
import type { Controller } from '@openvaa/core';
import type {
  IterateMapOperationParams,
  IterateMapPrompt,
  MapOperationParams,
  MapPrompt,
  ProcessingStep,
  ReduceOperationParams,
  ReducePrompt,
  VAAComment
} from '../../types';

/**
 * Defines the steps for a condensation operation based on the comments.
 * This function dynamically calculates the optimal batch size for the map step
 * and the optimal denominator for each reduce step to ensure efficient processing.
 * Note: this function is ad hoc for our Map-Reduce default condensation process.
 * If you want to use a custom condensation process, you need to create your own
 * steps with your own logic for how operation's and their params are chosen.
 *
 * @param comments - The comments to be processed.
 * @param mapPromptId - The ID for the map prompt.
 * @param mapIterationPromptId - The ID for the map iteration prompt.
 * @param reducePromptId - The ID for the reduce prompt.
 * @param language - The language for the prompts.
 * @param questionName - The name/topic of the question for validation.
 * @param parallelFactor - The number of batches to process in parallel.
 * @param modelTPMLimit - The model's TPM (tokens per minute) limit.
 * @param controller - Optional controller for warning messages during prompt loading.
 * @returns An array of processing steps for the condensation operation.
 */
export async function createCondensationSteps({
  comments,
  mapPromptId,
  mapIterationPromptId,
  reducePromptId,
  language,
  questionName,
  parallelFactor,
  modelTPMLimit,
  controller = new BaseController()
}: {
  comments: Array<VAAComment>;
  mapPromptId: string;
  mapIterationPromptId: string;
  reducePromptId: string;
  language: string;
  questionName: string;
  parallelFactor: number;
  modelTPMLimit: number;
  controller?: Controller;
}): Promise<Array<ProcessingStep>> {
  const totalComments = comments.length;
  if (totalComments < 1) {
    throw new Error('There must be at least one comment to process.');
  }

  const promptRegistry = await PromptRegistry.create(language, controller);

  const mapPrompt = promptRegistry.getPrompt(mapPromptId) as MapPrompt;
  const mapIterationPrompt = promptRegistry.getPrompt(mapIterationPromptId) as IterateMapPrompt;
  const reducePrompt = promptRegistry.getPrompt(reducePromptId) as ReducePrompt;

  // --- Dynamic Calculation of Batch Size with Validation ---

  // 1. Determine initial map batchSize - use max batch size, but if there are fewer comments, use the comment count
  const originalBatchSize = Math.min(totalComments, BATCH_PROCESSING.MAX_BATCH_SIZE);
  let currentBatchSize = originalBatchSize;
  let batches = createBatches({ array: comments, batchSize: currentBatchSize });

  // PRE-PROCESSING: Validate parallel batch token counts to prevent API failures
  // Makes sure that the combined number of tokens in the parallel calls does not exceed the model's TPM limit
  let validationResult = validateInputTokenCount({
    batches,
    topic: questionName,
    condensationPrompt: mapPrompt.promptText,
    parallelFactor,
    modelTPMLimit
  });

  // Automatic fallback mechanism with cumulative reduction: (-1, -2, -3) = (-1, -3, -6, -10, -15, ...)
  if (!validationResult.success) {
    controller.info(
      'Some of the processable comments are very long. Attempting to reduce the amount of comments per LLM call to avoid failures.'
    );

    let reductionStep = 1;
    let foundValidBatchSize = false;

    while (!foundValidBatchSize && currentBatchSize > BATCH_PROCESSING.MIN_BATCH_SIZE) {
      // Calculate cumulative reduction: 1 + 2 + 3 + ... + n = n*(n+1)/2
      const cumulativeReduction = (reductionStep * (reductionStep + 1)) / 2;
      currentBatchSize = Math.max(BATCH_PROCESSING.MIN_BATCH_SIZE, originalBatchSize - cumulativeReduction);

      // Recreate batches with new size and revalidate
      batches = createBatches({ array: comments, batchSize: currentBatchSize });
      validationResult = validateInputTokenCount({
        batches,
        topic: questionName,
        condensationPrompt: mapPrompt.promptText,
        parallelFactor,
        modelTPMLimit
      });

      if (validationResult.success) {
        foundValidBatchSize = true;
        controller.warning(
          `Reduced batch size from ${originalBatchSize} to ${currentBatchSize} due to long comments. ` +
            'This can significantly increase the time it takes to finish condensation.'
        );
      } else if (currentBatchSize === BATCH_PROCESSING.MIN_BATCH_SIZE) {
        // We've reached the minimum batch size and validation still fails
        break;
      }

      reductionStep++;
    }

    // If we still don't have a valid batch size after all reductions, throw error
    if (!validationResult.success) {
      const failedIndex = validationResult.failedBatchIndex ?? 0;
      const i = failedIndex * parallelFactor;
      const batchEnd = Math.min(i + parallelFactor, batches.length);
      const batchIndices = Array.from({ length: batchEnd - i }, (_, idx) => i + idx + 1);

      throw new Error(
        `Unable to process batches even with minimum batch size (${BATCH_PROCESSING.MIN_BATCH_SIZE} comments per batch). The input data has at least one comment that is too long. \n\n` +
          `Final attempt: Batch ${failedIndex + 1} (inputs ${batchIndices.join(', ')}) has ${(
            validationResult.tokenCount ?? 0
          ).toFixed(0)} tokens (max: ${modelTPMLimit})\n\n` +
          `Tried reducing batch size from ${originalBatchSize} down to ${BATCH_PROCESSING.MIN_BATCH_SIZE}.\n\n` +
          'The TPM limit has been set manually in the input configuration.\n\n' +
          ' SOLUTIONS:\n' +
          '   1. Clean up your input data (remove very long comments)\n' +
          '   2. Use a different LLM with a higher TPM limit\n' +
          '   3. Increase the modelTPMLimit if your model supports it\n' +
          '   4. Reduce parallelBatches to process fewer batches simultaneously\n' +
          '   5. Consider splitting your input into smaller chunks and processing separately'
      );
    }
  }

  // Use the validated batch size
  const batchSize = currentBatchSize;

  // Always start with map + iterate_map to maximize information flow from source comments to arguments
  const processingSteps: Array<ProcessingStep> = [
    {
      operation: CondensationOperations.MAP,
      params: {
        batchSize,
        condensationPromptId: mapPromptId,
        condensationPrompt: mapPrompt.promptText
      } as MapOperationParams
    },
    {
      operation: CondensationOperations.ITERATE_MAP,
      params: {
        batchSize,
        iterationPromptId: mapIterationPromptId,
        iterationPrompt: mapIterationPrompt.promptText
      } as IterateMapOperationParams
    }
  ];

  // 2. Determine reduce denominators
  let numArgumentLists = Math.ceil(totalComments / batchSize);

  while (numArgumentLists > 1) {
    let denominator = Math.min(numArgumentLists, BATCH_PROCESSING.MAX_DENOMINATOR);
    // Ensure denominator is at least 2 if there are lists to reduce
    if (numArgumentLists > 1) {
      denominator = Math.max(denominator, BATCH_PROCESSING.MIN_DENOMINATOR);
    }

    processingSteps.push({
      operation: CondensationOperations.REDUCE,
      params: {
        denominator,
        coalescingPromptId: reducePromptId,
        coalescingPrompt: reducePrompt.promptText
      } as ReduceOperationParams
    });

    numArgumentLists = Math.ceil(numArgumentLists / denominator);
  }

  return processingSteps;
}
