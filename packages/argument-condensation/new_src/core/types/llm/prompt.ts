import { CondensationOperation, CondensationOperations } from '../condensation/operation';
import type {
  GroundingOperationParams,
  MapOperationParams,
  ReduceOperationParams,
  RefineOperationParams
} from '../condensation/processParams';
import type { CondensationOutputType } from './condensationType';

/**
 * Describes a prompt used in the condensation process.
 *
 * @param promptId - Unique identifier for this prompt
 * @param promptText - The main prompt text or template
 * @param operation - The operation this prompt is associated with
 * @param condensationGoal - The type of condensation this prompt is designed to produce (pros or cons)
 * @param params - The parameters for the operation
 */
export interface CondensationPrompt {
  promptId: string;
  promptText: string;
  operation: CondensationOperation;
  condensationGoal: CondensationOutputType;
  params: RefineOperationParams | MapOperationParams | ReduceOperationParams | GroundingOperationParams;
}

/**
 * A prompt for the refine operation.
 * @param promptId - Unique identifier for this prompt
 * @param promptText - The main prompt text or template
 * @param operation - The operation this prompt is associated with
 * @param outputType - The type of output this prompt is designed to produce
 */
export interface RefinePrompt extends CondensationPrompt {
  operation: typeof CondensationOperations.REFINE;
  params: RefineOperationParams;
}

/**
 * A prompt for the map operation.
 * @param promptId - Unique identifier for this prompt
 * @param promptText - The main prompt text or template
 * @param operation - The operation this prompt is associated with
 * @param outputType - The type of output this prompt is designed to produce
 */
export interface MapPrompt extends CondensationPrompt {
  operation: typeof CondensationOperations.MAP;
  params: MapOperationParams;
}

export interface ReducePrompt extends CondensationPrompt {
  operation: typeof CondensationOperations.REDUCE;
  params: ReduceOperationParams;
}

export interface GroundingPrompt extends CondensationPrompt {
  operation: typeof CondensationOperations.GROUND;
  params: GroundingOperationParams;
}
