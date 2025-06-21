/**
 * Parameters for the refine operation.
 * @param batchSize - The number of arguments to process in each batch.
 * @param initialBatchPrompt - The prompt to use for the initial batch.
 * @param refinementPrompt - The prompt to use for the refinement.
 */
export interface RefineOperationParams {
  initialBatchPrompt: string;
  refinementPrompt: string;
  batchSize: number;
}

/**
 * Parameters for the map operation.
 * @param batchSize - The number of arguments to process in each batch.
 * @param condensationPrompt - The prompt to use for the condensation.
 */
export interface MapOperationParams {
  condensationPrompt: string;
  batchSize: number;
}

/**
 * Parameters for the reduce operation.
 * @param denominator - How many argument lists to coalesce into one?
 * @param coalescingPrompt - The prompt to use for the coalescing.
 */
export interface ReduceOperationParams {
  coalescingPrompt: string;
  denominator: number;
}

/**
 * Parameters for the grounding operation.
 * @param groundingPrompt - The prompt to use for the grounding.
 * @param batchSize - The number of arguments to process in each batch.
 */
export interface GroundingOperationParams {
  groundingPrompt: string;
  batchSize: number;
}
