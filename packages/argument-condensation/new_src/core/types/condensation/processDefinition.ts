import { CondensationOperation } from './operation';
import {
  GroundingOperationParams,
  MapOperationParams,
  ReduceOperationParams,
  RefineOperationParams
} from './processParams';

/**
 * A processing step in the condensation pipeline. Defines the type of operation to perform and the parameters 
 * for the operation. Processing steps are executed in order and there are limitations to how they can be combined.
 * 
 * @example
 * 
 * const step: ProcessingStep = {
 *   operation: CondensationOperation.MAP,
 *   params: {
 *     batchSize: 42,
 *     denominator: 10
 *   }
 * };
 */
export interface ProcessingStep {
  /** The type of the processing step (Map, IterateMap, Reduce, Refine or Ground) */
  operation: CondensationOperation;
  /** The parameters for the processing step. Unique to each operation type 
   * (except map and iterateMap which share identical params). */
  params: RefineOperationParams | MapOperationParams | ReduceOperationParams | GroundingOperationParams;
}
