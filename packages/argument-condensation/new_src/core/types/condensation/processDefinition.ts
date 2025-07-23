import { CondensationOperation } from './operation';
import {
  GroundingOperationParams,
  MapOperationParams,
  ReduceOperationParams,
  RefineOperationParams
} from './processParams';

/**
 * A processing step in the condensation pipeline.
 * @remarks
 * This is a type-level function that determines the type of the processing step based on the type of the operation.
 */
export interface ProcessingStep {
  /** The type of the processing step */
  operation: CondensationOperation;
  /** The parameters for the processing step */
  params: RefineOperationParams | MapOperationParams | ReduceOperationParams | GroundingOperationParams;
}
