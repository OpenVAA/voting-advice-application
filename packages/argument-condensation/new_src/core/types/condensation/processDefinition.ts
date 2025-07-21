import { CondensationOperation } from './operation';
import {
  GroundingOperationParams,
  MapOperationParams,
  ReduceOperationParams,
  RefineOperationParams
} from './processParams';

/**
 * A processing step in the condensation pipeline.
 *
 * @param operation - The type of the processing step.
 * @param params - The parameters for the processing step.
 * @remarks
 * This is a type-level function that determines the type of the processing step based on the type of the operation.
 */
export interface ProcessingStep {
  operation: CondensationOperation;
  params: RefineOperationParams | MapOperationParams | ReduceOperationParams | GroundingOperationParams;
}
