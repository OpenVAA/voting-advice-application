/**
 * Parameters for the refine operation.
 * The refine operation takes in a list of arguments and comments to refine the arguments with.
 * This is a sequential operation which goes through comments and refines the same list of arguments across multiple iterations.
 *
 * @example
 *
 * const params: RefineOperationParams = {
 *   initialBatchPromptId: 'Initial-batch-id',
 *   refinementPromptId: 'Refinement-id',
 *   batchSize: 42
 * };
 */
export interface RefineOperationParams {
  /** Initial batch prompt id (loaded from centralized registry) */
  initialBatchPromptId: string;
  /** Refinement prompt id (loaded from centralized registry) */
  refinementPromptId: string;
  /** The number of arguments to process in each batch */
  batchSize: number;
}

/**
 * Parameters for the map operation.
 * The map operation takes in comments and condenses them into a single argument list.
 *
 * @example
 *
 * const params: MapOperationParams = {
 *   condensationPromptId: 'Condensation-id',
 *   batchSize: 42
 * };
 */
export interface MapOperationParams {
  /** Condensation prompt id (loaded from centralized registry) */
  condensationPromptId: string;
  /** The number of comments to process in at once. */
  batchSize: number;
}

/**
 * Parameters for the iterate map operation.
 * The iterate map operation takes in argument lists and their original comments to refine the arguments.
 * This is the second phase of the map operation that improves arguments using both the extracted arguments and original comments.
 *
 * @example
 *
 * const params: IterateMapOperationParams = {
 *   iterationPromptId: 'Iteration-id',
 *   batchSize: 42
 * };
 */
export interface IterateMapOperationParams {
  /** Iteration prompt id (loaded from centralized registry) */
  iterationPromptId: string;
  /** The number of comment batches to process at once. Should match the map step batch size */
  batchSize: number;
}

/**
 * Parameters for the reduce operation.
 * The reduce operation takes in a list of argument lists and coalesces them into a single argument list.
 *
 * @example
 *
 * const params: ReduceOperationParams = {
 *   coalescingPromptId: 'Coalescing-id',
 *   denominator: 42
 * };
 */
export interface ReduceOperationParams {
  /** Coalescing prompt id (loaded from centralized registry) */
  coalescingPromptId: string;
  /** How many argument lists to coalesce into one argument list? */
  denominator: number;
}

/**
 * Parameters for the grounding operation.
 * The grounding operation takes in a list of arguments and comments to refine the arguments with.
 * Grounding is a parallellizable operation in contrast with the operation 'refine' which maintains
 * a single list of arguments across multiple iterations.
 *
 * @example
 *
 * const params: GroundingOperationParams = {
 *   groundingPromptId: 'Grounding-id',
 *   batchSize: 42
 * };
 */
export interface GroundingOperationParams {
  /** Grounding prompt id (loaded from centralized registry) */
  groundingPromptId: string;
  /** The number of source comments to use as context for the grounding prompt to improve the argument list */
  batchSize: number;
}
