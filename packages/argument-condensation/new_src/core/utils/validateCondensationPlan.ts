import { CondensationPlan, ProcessingStep } from '../types/condensation/processDefinition';
import { 
  RefineOperationParams, 
  MapOperationParams, 
  ReduceOperationParams, 
  GroundingOperationParams 
} from '../types/condensation/processParams';
import { CondensationOperations } from '../types/condensation/operation';

/**
 * The result of validating a condensation plan.
 * 
 * @param isValid - Whether the plan is valid.
 * @param errors - The errors that occurred during validation.
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate a condensation plan.
 * 
 * @param plan - The condensation plan to validate.
 * @param totalComments - The total number of comments in the input.
 * @returns A validation result.
 */

export function validateCondensationPlan(
  plan: CondensationPlan, 
  totalComments: number
): ValidationResult {
  const errors: string[] = [];
  
  if (plan.steps.length === 0) {
    errors.push('Condensation plan must have at least one step');
    return { isValid: false, errors };
  }
  
  // Track data state through the pipeline
  let currentDataType: 'comments' | 'arguments' | 'argumentLists' = 'comments';
  let currentCount: number = totalComments;
  
  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];
    
    switch (step.operation) {
      case CondensationOperations.REFINE:
        if (currentDataType !== 'comments') {
          errors.push(`REFINE operation at position ${i} expects comments but got ${currentDataType}`);
        }
        const refineParams = step.params as RefineOperationParams;
        if (refineParams.batchSize <= 0) {
          errors.push(`REFINE batchSize must be positive, got ${refineParams.batchSize}`);
        }
        currentDataType = 'arguments';
        currentCount = Math.ceil(currentCount / refineParams.batchSize);
        break;
        
      case CondensationOperations.MAP:
        if (currentDataType !== 'comments') {
          errors.push(`MAP operation at position ${i} expects comments but got ${currentDataType}`);
        }
        const mapParams = step.params as MapOperationParams;
        if (mapParams.batchSize <= 0) {
          errors.push(`MAP batchSize must be positive, got ${mapParams.batchSize}`);
        }
        currentDataType = 'argumentLists';
        currentCount = Math.ceil(currentCount / mapParams.batchSize);
        break;
        
      case CondensationOperations.REDUCE:
        if (currentDataType !== 'argumentLists') {
          errors.push(`REDUCE operation at position ${i} expects argumentLists but got ${currentDataType}`);
        }
        const reduceParams = step.params as ReduceOperationParams;
        if (reduceParams.denominator <= 0) {
          errors.push(`REDUCE denominator must be positive, got ${reduceParams.denominator}`);
        }
        if (currentCount < 2) {
          errors.push(`REDUCE operation requires at least 2 argument lists, but only ${currentCount} are available`);
        }
        if (reduceParams.denominator > currentCount) {
          errors.push(`REDUCE denominator (${reduceParams.denominator}) cannot be larger than available argument lists (${currentCount})`);
        }
        if (currentCount <= reduceParams.denominator) {
          currentDataType = 'arguments';
          currentCount = 1;
        } else {
          currentCount = Math.ceil(currentCount / reduceParams.denominator);
        }
        break;
        
      case CondensationOperations.GROUND:
        if (currentDataType !== 'arguments' && currentDataType !== 'argumentLists') {
          errors.push(`GROUND operation at position ${i} expects arguments or argumentLists but got ${currentDataType}`);
        }
        // GROUND doesn't change data type or count
        break;
    }
  }
  
  // After the loop, validate final operation produces exactly 1 argument list
  const finalStep = plan.steps[plan.steps.length - 1];
  switch (finalStep.operation) {
    case CondensationOperations.REDUCE:
      const reduceParams = finalStep.params as ReduceOperationParams;
      if (currentCount > reduceParams.denominator) {
        errors.push(`Final REDUCE operation would produce ${Math.ceil(currentCount / reduceParams.denominator)} argument lists, but must produce exactly 1`);
      }
      break;
  }
  
  // Check for required patterns
  const hasMap = plan.steps.some(step => step.operation === CondensationOperations.MAP);
  const hasReduce = plan.steps.some(step => step.operation === CondensationOperations.REDUCE);
  if (hasMap && !hasReduce) {
    errors.push(`MAP operation must be followed by REDUCE operation`);
  }
  
  // Check for map-reduce sequence
  for (let i = 0; i < plan.steps.length - 1; i++) {
    if (plan.steps[i].operation === CondensationOperations.MAP && plan.steps[i + 1].operation !== CondensationOperations.REDUCE) {
      errors.push(`MAP operation at position ${i} must be immediately followed by REDUCE operation`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
