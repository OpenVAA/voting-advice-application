import { CondensationOperation } from './operation';
import {
  GroundingOperationParams,
  MapOperationParams,
  ReduceOperationParams,
  RefineOperationParams
} from './processParams';
import { CondensationOutputType } from '../llm/condensationType';

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

/**
 * A customized plan for the condensation process. Consists of a sequence of pre-defined operations.
 *
 * @param nOutputArgs - The number of arguments to output.
 * @param steps - The steps (operations) used to condense the arguments.
 * @param language - The language of the arguments.
 * @param outputType - The type of condensation this plan is designed to produce (pros or cons)
 */
export interface CondensationPlan {
  outputType: CondensationOutputType;
  steps: Array<ProcessingStep>;
  nOutputArgs: number;
  language: string;
}
