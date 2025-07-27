/**
 * Parameters for the refine operation. 
 * The refine operation takes in a list of arguments and comments to refine the arguments with.
 * This is a sequential operation which goes through comments and refines the same list of arguments across multiple iterations.
 * 
 * @example
 * 
 * const params: RefineOperationParams = {
 *   initialBatchPrompt: 'Get this prompt from the prompt registry',
 *   refinementPrompt: 'Get this prompt from the prompt registry',
 *   batchSize: 42
 * };
 */
export interface RefineOperationParams {
  /** The prompt to use for the initial batch. Doesn't have an argument list as context, only comments */
  initialBatchPrompt: string;
  /** The prompt to use for the refinement. Takes in an argument list and comments to refine the running argument list with */
  refinementPrompt: string;
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
 *   condensationPrompt: 'Get this prompt from the prompt registry',
 *   iterationPrompt: 'Get this prompt from the prompt registry',
 *   batchSize: 42
 * };
 */
export interface MapOperationParams {
  /** The prompt to use for the condensation. Takes in a list of comments and condenses them into a single argument list. */
  condensationPrompt: string;
  /** Prompt to use for improving the argument lists created by the condensation prompt. Takes in both the original comments and the argument lists. */
  iterationPrompt: string;
  /** The number of comments to process in at once. Applies to both map prompts */
  batchSize: number;
}

/**
 * Parameters for the reduce operation. 
 * The reduce operation takes in a list of argument lists and coalesces them into a single argument list.
 * 
 * @example
 * 
 * const params: ReduceOperationParams = {
 *   coalescingPrompt: 'Get this prompt from the prompt registry',
 *   denominator: 42
 * };
 */
export interface ReduceOperationParams {
  /** The prompt to use for combining argument lists. */
  coalescingPrompt: string;
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
 *   groundingPrompt: 'Get this prompt from the prompt registry',
 *   batchSize: 42
 * };
 */
export interface GroundingOperationParams {
  /** The prompt to use for improving an arguments list with comments */
  groundingPrompt: string;
  /** The number of source comments to use as context for the grounding prompt to improve the argument list */
  batchSize: number;
}
