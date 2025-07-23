import { CondensationOperation, CondensationOperations } from '../condensation/operation';
import type { CondensationOutputType } from '../condensation/condensationType';
import type {
  GroundingOperationParams,
  MapOperationParams,
  ReduceOperationParams,
  RefineOperationParams
} from '../condensation/processParams';

/**
 * Describes a prompt used in the condensation process.
 */
export interface CondensationPrompt {
  /** The unique identifier for this prompt */
  promptId: string;
  /** The main prompt text or template */
  promptText: string;
  /** The operation this prompt is associated with */
  operation: CondensationOperation;
  /** The type of condensation this prompt is designed to produce (pros or cons) */
  condensationGoal: CondensationOutputType;
  /** The parameters for the operation */
  params: RefineOperationParams | MapOperationParams | ReduceOperationParams | GroundingOperationParams;
}

/**
 * A prompt for the refine operation.
 */
export interface RefinePrompt extends CondensationPrompt {
  /** The operation this prompt is associated with */
  operation: typeof CondensationOperations.REFINE;
  /** The parameters for the operation */
  params: RefineOperationParams;
}

/**
 * A prompt for the map operation.
 */
export interface MapPrompt extends CondensationPrompt {
  /** The operation this prompt is associated with */
  operation: typeof CondensationOperations.MAP;
  /** The parameters for the operation */
  params: MapOperationParams;
}

/**
 * A prompt for the reduce operation.
 */
export interface ReducePrompt extends CondensationPrompt {
  /** The operation this prompt is associated with */
  operation: typeof CondensationOperations.REDUCE;
  /** The parameters for the operation */
  params: ReduceOperationParams;
}

/**
 * A prompt for the grounding operation.
 */
export interface GroundingPrompt extends CondensationPrompt {
  /** The operation this prompt is associated with */
  operation: typeof CondensationOperations.GROUND;
  /** The parameters for the operation */
  params: GroundingOperationParams;
}
