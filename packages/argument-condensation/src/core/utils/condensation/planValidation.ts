import { CondensationOperations } from '../../types';
import type {
  GroundingOperationParams,
  IterateMapOperationParams,
  MapOperationParams,
  ProcessingStep,
  ReduceOperationParams,
  RefineOperationParams
} from '../../types';

/**
 * Validate an entire condensation plan.
 * Throws if something is wrong – no return value on success.
 * Works by checking:
 * - if the plan has at least one step
 * - if refine is found at any other position than the first step (if yes, throw)
 * - if the steps are valid (parameters are correct)
 * - if the output after performing all steps is exactly one argument list (if not, throw)
 *
 * @param steps - The steps of the condensation plan
 * @param commentCount - The number of comments in the input
 */
export function validatePlan({ steps, commentCount }: { steps: Array<ProcessingStep>; commentCount: number }): void {
  if (commentCount === 0) {
    throw new Error('Cannot run condensation with empty comments array. At least one comment is required.');
  }

  if (steps.length === 0) {
    throw new Error('Condensation plan must have at least one step');
  }

  // 1. First, check for global structural rules, like the position of refine.
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].operation === CondensationOperations.REFINE && i !== 0) {
      throw new Error(`refine operation can only be the first step, found at step ${i}`);
    }
  }

  // 2. Then, check parameters and step-to-step flow.
  for (let i = 0; i < steps.length; i++) {
    validateStepParameters(steps[i]);

    const nextStep = steps[i + 1];
    if (nextStep) {
      validateStepFlow(steps[i], nextStep);
    }
  }

  // 3. mathematical output-shape check: is the output of the pipeline exactly one argument list?
  validatePipelineOutputs(steps, commentCount);
}

/**
 * Validate the parameters of a step by checking they are of the correct type and have the correct values.
 *
 * @param step - The step to validate
 */
function validateStepParameters(step: ProcessingStep): void {
  const operation = step.operation;
  const params = step.params;

  switch (operation) {
    case CondensationOperations.REFINE: {
      const p = params as RefineOperationParams;
      if (p.batchSize <= 0) throw new Error('refine batchSize must be positive');
      if (!p.initialBatchPrompt) throw new Error('refine needs initialBatchPrompt');
      if (!p.refinementPrompt) throw new Error('refine needs refinementPrompt');
      break;
    }
    case CondensationOperations.MAP: {
      const p = params as MapOperationParams;
      if (p.batchSize <= 0) throw new Error('map batchSize must be positive');
      if (!p.condensationPrompt) throw new Error('map needs condensationPrompt');
      break;
    }
    case CondensationOperations.ITERATE_MAP: {
      const p = params as IterateMapOperationParams;
      if (p.batchSize <= 0) throw new Error('iterate_map batchSize must be positive');
      if (!p.iterationPrompt) throw new Error('iterate_map needs iterationPrompt');
      break;
    }
    case CondensationOperations.REDUCE: {
      const p = params as ReduceOperationParams;
      if (p.denominator <= 1) throw new Error('reduce denominator must be greater than 1');
      if (!p.coalescingPrompt) throw new Error('reduce needs coalescingPrompt');
      break;
    }
    case CondensationOperations.GROUND: {
      const p = params as GroundingOperationParams;
      if (p.batchSize <= 0) throw new Error('ground batchSize must be positive');
      if (!p.groundingPrompt) throw new Error('ground needs groundingPrompt');
      break;
    }
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

/**
 * Validate the flow of steps by checking that:
 * - refine can only be followed by ground (or nothing)
 * - If map is continued by iterateMap, then iterateMap must have the same batchSize as map
 * - Also, if iterateMap is continued by iterateMap, then these two must have the same batchSize
 *
 * @param current - The current step
 * @param next - The next step
 */
function validateStepFlow(current: ProcessingStep, next: ProcessingStep): void {
  if (current.operation === CondensationOperations.REFINE && next.operation !== CondensationOperations.GROUND) {
    throw new Error('refine can only be followed by ground');
  }
  if (current.operation === CondensationOperations.MAP && next.operation === CondensationOperations.ITERATE_MAP) {
    const currentParams = current.params as MapOperationParams;
    const nextParams = next.params as IterateMapOperationParams;
    if (currentParams.batchSize !== nextParams.batchSize) {
      throw new Error('Consecutive map and iterate_map operations must have the same batchSize');
    }
  }
  if (
    current.operation === CondensationOperations.ITERATE_MAP &&
    next.operation === CondensationOperations.ITERATE_MAP
  ) {
    const currentParams = current.params as IterateMapOperationParams;
    const nextParams = next.params as IterateMapOperationParams;
    if (currentParams.batchSize !== nextParams.batchSize) {
      throw new Error('Consecutive iterate_map operations must have the same batchSize');
    }
  }
  // (other constraints are already implicitly satisfied or allowed)
}

function validatePipelineOutputs(steps: Array<ProcessingStep>, commentCount: number): void {
  let structure: 'comments' | 'list' | 'listOfLists' = 'comments';
  let batchCount = 1;

  for (let idx = 0; idx < steps.length; idx++) {
    const step = steps[idx];

    switch (step.operation) {
      case CondensationOperations.REFINE: {
        const { batchSize } = step.params as RefineOperationParams;
        batchCount = Math.ceil(commentCount / batchSize);
        structure = 'list';
        break;
      }
      case CondensationOperations.MAP: {
        const { batchSize } = step.params as MapOperationParams;
        batchCount = Math.ceil(commentCount / batchSize);
        structure = batchCount > 1 ? 'listOfLists' : 'list';
        break;
      }
      case CondensationOperations.ITERATE_MAP:
        // iterate_map doesn't change the structure - it just refines existing argument lists
        // Structure remains the same as after map
        break;
      case CondensationOperations.REDUCE: {
        const { denominator } = step.params as ReduceOperationParams;
        batchCount = Math.ceil(batchCount / denominator);
        structure = batchCount === 1 ? 'list' : 'listOfLists';
        break;
      }
      case CondensationOperations.GROUND:
        // structure unchanged, as ground just makes sure the argument list actually reflects the input comments
        break;
    }
  }

  if (structure !== 'list') {
    throw new Error(`Pipeline must end with a single list, but ends with ${structure} in ${batchCount} batch(es)`);
  }
}
