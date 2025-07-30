import {
  CondensationOperations,
  GroundingOperationParams,
  MapOperationParams,
  ProcessingStep,
  ReduceOperationParams,
  RefineOperationParams
} from '../../types';

/*********** Public API ******************************************************/

/**
 * Validate an entire condensation plan.
 * Throws if something is wrong – no return value on success.
 * Works by checking:
 * - if the plan has at least one step
 * - if REFINE is found at any other position than the first step (if yes, throw)
 * - if the steps are valid (parameters are correct)
 * - if the output after performing all steps is exactly one argument list (if not, throw)
 * 
 * @param steps - The steps of the condensation plan
 * @param commentCount - The number of comments in the input
 */
export function validatePlan({ steps, commentCount }: { steps: Array<ProcessingStep>, commentCount: number }): void {
  if (commentCount === 0) {
    throw new Error('Cannot run condensation with empty comments array. At least one comment is required.');
  }

  if (steps.length === 0) {
    throw new Error('Condensation plan must have at least one step');
  }

  // 1. First, check for global structural rules, like the position of REFINE.
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].operation === CondensationOperations.REFINE && i !== 0) {
      throw new Error(`REFINE operation can only be the first step, found at step ${i}`);
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

  // Make that if MAP is the last step, there is only one batch
  const finalStep = steps.at(-1)!;
  if (finalStep.operation === CondensationOperations.MAP) {
    const p = finalStep.params as MapOperationParams;
    if (p.batchSize !== 1) {
      throw new Error('MAP operation must produce a single batch if it is the final step');
    }
  }

  // 2. mathematical output-shape check: is the output of the pipeline exactly one argument list?
  validatePipelineOutputs(steps, commentCount);
}

/*********** Internal helpers ************************************************/

/**
 * Validate the parameters of a step by checking they are of the correct type and have the correct values.
 * 
 * @param step - The step to validate
 */
function validateStepParameters(step: ProcessingStep): void {
  switch (step.operation) {
    case CondensationOperations.REFINE: {
      const p = step.params as RefineOperationParams;
      if (p.batchSize <= 0) throw new Error('REFINE batchSize must be positive');
      if (!p.initialBatchPrompt || !p.refinementPrompt) {
        throw new Error('REFINE needs initialBatchPrompt and refinementPrompt.');
      }
      break;
    }
    case CondensationOperations.MAP: {
      const p = step.params as MapOperationParams;
      if (p.batchSize <= 0) throw new Error('MAP batchSize must be positive');
      if (!p.condensationPrompt) throw new Error('MAP needs condensationPrompt');
      if (!p.iterationPrompt) throw new Error('MAP needs iterationPrompt');
      break;
    }
    case CondensationOperations.REDUCE: {
      const p = step.params as ReduceOperationParams;
      if (p.denominator <= 0) throw new Error('REDUCE denominator must be positive');
      if (!p.coalescingPrompt) throw new Error('REDUCE needs coalescingPrompt');
      break;
    }
    case CondensationOperations.GROUND: {
      const p = step.params as GroundingOperationParams;
      if (p.batchSize <= 0) throw new Error('GROUND batchSize must be positive');
      if (!p.groundingPrompt) throw new Error('GROUND needs groundingPrompt');
      break;
    }
  }
}

/**
 * Validate the flow of steps by checking that:
 * - MAP must be followed by REDUCE
 * - REFINE can only be followed by GROUND (or nothing)
 * 
 * @param current - The current step
 * @param next - The next step
 */
function validateStepFlow(current: ProcessingStep, next: ProcessingStep): void {
  if (current.operation === CondensationOperations.MAP && next.operation !== CondensationOperations.REDUCE) {
    throw new Error('MAP must be followed by REDUCE. If you want to condense only one batch, please use REFINE instead of MAP.');
  }

  if (current.operation === CondensationOperations.REFINE && next.operation !== CondensationOperations.GROUND) {
    throw new Error('REFINE can only be followed by GROUND');
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
      case CondensationOperations.REDUCE: {
        const { denominator } = step.params as ReduceOperationParams;
        batchCount = Math.ceil(batchCount / denominator);
        structure = batchCount === 1 ? 'list' : 'listOfLists';
        break;
      }
      case CondensationOperations.GROUND:
        // structure unchanged, as ground just makes sure the argument list actually reflects the input comments
        // even if we have done a lot of refine operations that use LLM-generated outputs as inputs
        break;
    }
  }

  if (structure !== 'list') {
    throw new Error(`Pipeline must end with a single list, but ends with ${structure} in ${batchCount} batch(es)`);
  }
}
