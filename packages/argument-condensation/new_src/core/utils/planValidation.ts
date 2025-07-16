import {
  CondensationOperations,
  CondensationPlan,
  GroundingOperationParams,
  MapOperationParams,
  ProcessingStep,
  ReduceOperationParams,
  RefineOperationParams
} from '../types';

/*********** Public API ******************************************************/

/**
 * Validate an entire condensation plan.
 * Throws if something is wrong – no return value on success.
 */
export function validatePlan(plan: CondensationPlan, commentCount: number): void {
  if (plan.steps.length === 0) {
    throw new Error('Condensation plan must have at least one step');
  }

  // 1. rule-based checks on individual steps & flow
  for (let i = 0; i < plan.steps.length; i++) {
    if (plan.steps[i].operation === CondensationOperations.REFINE && i !== 0) {
      throw new Error(`REFINE operation can only be the first step, found at step ${i}`);
    }

    validateStepParameters(plan.steps[i]);

    const nextStep = plan.steps[i + 1];
    if (nextStep) {
      validateStepFlow(plan.steps[i], nextStep);
    }
  }

  // MAP cannot be the last op
  const finalStep = plan.steps.at(-1)!;
  if (finalStep.operation === CondensationOperations.MAP) {
    throw new Error('MAP operation cannot be the final step – it produces argument lists, not arguments');
  }

  // 2. mathematical output-shape check
  validatePipelineOutputs(plan, commentCount);
}

/*********** Internal helpers ************************************************/

function validateStepParameters(step: ProcessingStep): void {
  switch (step.operation) {
    case CondensationOperations.REFINE: {
      const p = step.params as RefineOperationParams;
      if (p.batchSize <= 0) throw new Error('REFINE batchSize must be positive');
      if (!p.initialBatchPrompt || !p.refinementPrompt) {
        throw new Error('REFINE needs initialBatchPrompt and refinementPrompt');
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

function validateStepFlow(current: ProcessingStep, next: ProcessingStep): void {
  if (current.operation === CondensationOperations.MAP && next.operation !== CondensationOperations.REDUCE) {
    throw new Error('MAP must be followed by REDUCE');
  }

  if (current.operation === CondensationOperations.REFINE && next.operation !== CondensationOperations.GROUND) {
    throw new Error('REFINE can only be followed by GROUND');
  }
  // (other constraints are already implicitly satisfied or allowed)
}

function validatePipelineOutputs(plan: CondensationPlan, commentCount: number): void {
  let structure: 'comments' | 'list' | 'listOfLists' = 'comments';
  let batchCount = 1;

  for (let idx = 0; idx < plan.steps.length; idx++) {
    const step = plan.steps[idx];

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
        /* structure unchanged */ break;
    }

    console.info(`Step ${idx} (${step.operation}): ${structure} / ${batchCount} batch(es)`);
  }

  if (structure !== 'list') {
    throw new Error(`Pipeline must end with a single list, but ends with ${structure} in ${batchCount} batch(es)`);
  }
}
