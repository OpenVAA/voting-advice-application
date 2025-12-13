import { CondensationOperations } from '../../types';
import type { MapOperationParams, ProcessingStep, ReduceOperationParams, RefineOperationParams } from '../../types';

/**
 * Calculate the number of LLM calls that each processing step will make.
 * This is useful for assigning weights to sub-operations in progress tracking.
 *
 * The calculation is based on the structure of the data and the batch sizes/denominators
 * specified in each step's parameters.
 *
 * @param steps - The processing steps to analyze
 * @param commentCount - The number of comments in the input
 * @returns Array of objects with step index, operation type, and LLM call count
 */
export function calculateLLMCallCounts(
  steps: Array<ProcessingStep>,
  commentCount: number
): Array<{ stepIndex: number; operation: keyof typeof CondensationOperations; llmCallCount: number }> {
  if (commentCount === 0) {
    throw new Error('Cannot calculate LLM call counts with empty comments array');
  }

  if (steps.length === 0) {
    return [];
  }

  const results: Array<{ stepIndex: number; operation: keyof typeof CondensationOperations; llmCallCount: number }> =
    [];
  let currentBatchCount = 1;
  let currentStructure: 'comments' | 'list' | 'listOfLists' = 'comments';

  for (let idx = 0; idx < steps.length; idx++) {
    const step = steps[idx];
    let llmCallCount = 0;

    switch (step.operation) {
      case CondensationOperations.REFINE: {
        const { batchSize } = step.params as RefineOperationParams;
        // Refine processes batches sequentially, so each batch is one LLM call
        llmCallCount = Math.ceil(commentCount / batchSize);
        currentBatchCount = llmCallCount;
        currentStructure = 'list';
        break;
      }

      case CondensationOperations.MAP: {
        const { batchSize } = step.params as MapOperationParams;
        // Map processes batches in parallel, so each batch is one LLM call
        llmCallCount = Math.ceil(commentCount / batchSize);
        currentBatchCount = llmCallCount;
        currentStructure = llmCallCount > 1 ? 'listOfLists' : 'list';
        break;
      }

      case CondensationOperations.ITERATE_MAP: {
        // Iterate_map processes batches in parallel, so each batch is one LLM call
        // The number of batches should match the previous map step
        llmCallCount = currentBatchCount;
        // Structure remains the same as after map
        break;
      }

      case CondensationOperations.REDUCE: {
        const { denominator } = step.params as ReduceOperationParams;
        // Reduce processes chunks in parallel, so each chunk is one LLM call
        llmCallCount = Math.ceil(currentBatchCount / denominator);
        currentBatchCount = llmCallCount;
        currentStructure = currentBatchCount === 1 ? 'list' : 'listOfLists';
        break;
      }

      case CondensationOperations.GROUND: {
        // Ground processes argument lists in parallel, so each list is one LLM call
        // The number of lists depends on the current structure
        if (currentStructure === 'list') {
          llmCallCount = 1;
        } else {
          llmCallCount = currentBatchCount;
        }
        // Structure unchanged, as ground just refines existing argument lists
        break;
      }

      default:
        throw new Error(`Unknown operation: ${step.operation}`);
    }

    results.push({
      stepIndex: idx,
      operation: step.operation as keyof typeof CondensationOperations,
      llmCallCount
    });
  }

  return results;
}

/**
 * Calculate weights for sub-operations based on LLM call counts.
 * This is useful for progress tracking where more LLM calls should have higher weight.
 *
 * @param steps - The processing steps to analyze
 * @param commentCount - The number of comments in the input
 * @returns Array of objects with step index, operation type, and calculated weight
 */
export function calculateStepWeights(
  steps: Array<ProcessingStep>,
  commentCount: number
): Array<{ stepIndex: number; operation: string; weight: number }> {
  const llmCallCounts = calculateLLMCallCounts(steps, commentCount);

  // Calculate total LLM calls to normalize weights
  const totalLLMCalls = llmCallCounts.reduce((sum, step) => sum + step.llmCallCount, 0);

  if (totalLLMCalls === 0) {
    return steps.map((step, idx) => ({ stepIndex: idx, operation: step.operation, weight: 1 }));
  }

  // Normalize weights so they sum to the total number of steps
  // This ensures each step gets a proportional weight based on LLM calls
  return llmCallCounts.map((step) => ({
    stepIndex: step.stepIndex,
    operation: step.operation,
    weight: Math.max(1, Math.round((step.llmCallCount / totalLLMCalls) * steps.length))
  }));
}
