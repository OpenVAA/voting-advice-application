/**
 * Parameters for the refine operation.
 */
export interface RefineOperationParams {
  /** The prompt to use for the initial batch */
  initialBatchPrompt: string;
  /** The prompt to use for the refinement */
  refinementPrompt: string;
  /** The number of arguments to process in each batch */
  batchSize: number;
}

/**
 * Parameters for the map operation.
 */
export interface MapOperationParams {
  /** The prompt to use for the condensation */
  condensationPrompt: string;
  /** Prompt to use for improving the initial batches of arguments */
  iterationPrompt: string;
  /** The number of arguments to process in each batch */
  batchSize: number;
}

/**
 * Parameters for the reduce operation.
 */
export interface ReduceOperationParams {
  /** The prompt to use for the coalescing */
  coalescingPrompt: string;
  /** How many argument lists to coalesce into one? */
  denominator: number;
}

/**
 * Parameters for the grounding operation.
 */
export interface GroundingOperationParams {
  /** The prompt to use for the grounding */
  groundingPrompt: string;
  /** The number of arguments to process in each batch */
  batchSize: number;
}
