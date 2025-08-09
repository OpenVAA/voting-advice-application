import type { CondensationOutputType } from '../condensation/condensationType';
import type { CONDENSATION_OPERATIONS, CondensationOperation } from '../condensation/operation';
import type {
  GroundingOperationParams,
  IterateMapOperationParams,
  MapOperationParams,
  ReduceOperationParams,
  RefineOperationParams
} from '../condensation/processParams';

/**
 * Describes a prompt used in the condensation process.
 *
 * @example
 *
 * const prompt: CondensationPrompt = {
 *   promptId: '123',
 *   promptText: 'This is a prompt',
 *   operation: CondensationOperation.MAP,
 *   condensationType: CondensationOutputType.PROS,
 *   params: {
 *     batchSize: 10,
 *     condensationPrompt: 'This is a prompt',
 *     condensationPromptId: 'condensation-id'
 *   }
 * };
 */
export interface CondensationPrompt {
  promptId: string;
  promptText: string;
  /** The operation this prompt accomplished, e.g. map */
  operation: CondensationOperation;
  /** The type of condensation this prompt is designed to produce (pros or cons) */
  condensationType: CondensationOutputType;
  /** The parameters for the operation. Depends on the operation */
  params:
    | RefineOperationParams
    | MapOperationParams
    | IterateMapOperationParams
    | ReduceOperationParams
    | GroundingOperationParams;
}

/**
 * A prompt for the refine operation.
 *
 * @example
 *
 * const prompt: RefinePrompt = {
 *   promptId: '123',
 *   promptText: 'This is a prompt',
 *   operation: CondensationOperation.REFINE,
 *   condensationType: CondensationOutputType.PROS,
 *   params: {
 *     initialBatchPrompt: 'This is a prompt',
 *     refinementPrompt: 'This is a prompt',
 *     batchSize: 10
 *   }
 * };
 */
export interface RefinePrompt extends CondensationPrompt {
  /** The operation this prompt is designed to accomplish, e.g. refine */
  operation: typeof CONDENSATION_OPERATIONS.REFINE;
  /** The parameters for the operation. Depends on the operation */
  params: RefineOperationParams;
}

/**
 * A prompt for the map operation.
 *
 * @example
 * const prompt: MapPrompt = {
 *   promptId: '123',
 *   promptText: 'This is a prompt',
 *   operation: CondensationOperation.MAP,
 *   condensationType: CondensationOutputType.PROS,
 *   params: {
 *     batchSize: 10,
 *     condensationPrompt: 'This is a prompt',
 *     condensationPromptId: 'condensation-id'
 *   }
 * };
 */
export interface MapPrompt extends CondensationPrompt {
  /** The operation this prompt is designed to accomplish, e.g. map */
  operation: typeof CONDENSATION_OPERATIONS.MAP;
  /** The parameters for the operation. Depends on the operation */
  params: MapOperationParams;
}

/**
 * A prompt for the iterate map operation.
 */
export interface IterateMapPrompt extends CondensationPrompt {
  /** The operation this prompt is designed to accomplish, e.g. iterate_map */
  operation: typeof CONDENSATION_OPERATIONS.ITERATE_MAP;
  /** The parameters for the operation. Depends on the operation */
  params: IterateMapOperationParams;
}

/**
 * A prompt for the reduce operation.
 *
 * @example
 * const prompt: ReducePrompt = {
 *   promptId: '123',
 *   promptText: 'This is a prompt',
 *   operation: CondensationOperation.REDUCE,
 *   condensationType: CondensationOutputType.PROS,
 *   params: {
 *     coalescingPrompt: 'This is a prompt',
 *     denominator: 5
 *   }
 * };
 */
export interface ReducePrompt extends CondensationPrompt {
  /** The operation this prompt is designed to accomplish, e.g. reduce */
  operation: typeof CONDENSATION_OPERATIONS.REDUCE;
  /** The parameters for the operation. Depends on the operation */
  params: ReduceOperationParams;
}

/**
 * A prompt for the grounding operation.
 *
 * @example
 * const prompt: GroundingPrompt = {
 *   promptId: '123',
 *   promptText: 'This is a prompt',
 *   operation: CondensationOperation.GROUND,
 *   condensationType: CondensationOutputType.PROS,
 *   params: {
 *     groundingPrompt: 'This is a prompt',
 *     batchSize: 42
 *   }
 * };
 */
export interface GroundingPrompt extends CondensationPrompt {
  /** The operation this prompt is designed to accomplish, e.g. ground */
  operation: typeof CONDENSATION_OPERATIONS.GROUND;
  /** The parameters for the operation. Depends on the operation */
  params: GroundingOperationParams;
}
