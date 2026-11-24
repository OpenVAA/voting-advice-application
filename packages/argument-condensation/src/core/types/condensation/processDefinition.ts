import type { CondensationOperation } from './operation';
import type {
  GroundingOperationParams,
  IterateMapOperationParams,
  MapOperationParams,
  ReduceOperationParams,
  RefineOperationParams
} from './processParams';

/**
 * A processing step in the condensation pipeline. Defines the type of operation to perform and the parameters for the operation. Processing steps are executed in order and there are limitations to how they can be combined.
 *
 * @example
 * ```ts
 * const step: ProcessingStep = {
 *   operation: 'MAP',
 *   params: {
 *     condensationPromptId: 'Condensation-id', // A prompt id from the prompt registry
 *     batchSize: 42
 *   }
 * };
 * ```
 */
export interface ProcessingStep {
  /** The type of the processing step (Map, IterateMap, Reduce, Refine or Ground) */
  operation: CondensationOperation;
  /** The parameters for the processing step. Unique to each operation type. */
  params:
    | RefineOperationParams
    | MapOperationParams
    | IterateMapOperationParams
    | ReduceOperationParams
    | GroundingOperationParams;
}
