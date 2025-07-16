import {
  CondensationOperations,
  CondensationOutputType,
  CondensationPlan,
  MapOperationParams,
  MapPrompt,
  ReduceOperationParams,
  ReducePrompt
} from '../types';

/**
 * Create a condensation configuration plan
 * @param mapPrompt - Prompt for MAP operation
 * @param reducePrompt - Prompt for REDUCE operation
 * @param iterationPrompt - Prompt for iteration feedback
 * @param condensationType - Type of condensation (pros/cons)
 * @param nOutputArgs - Number of output arguments
 * @param language - Language for the condensation
 * @returns CondensationPlan
 */
export function createCondensationPlan({
  mapPrompt,
  reducePrompt,
  iterationPrompt,
  condensationType,
  nOutputArgs,
  language
}: {
  mapPrompt: MapPrompt;
  reducePrompt: ReducePrompt;
  iterationPrompt: MapPrompt;
  condensationType: CondensationOutputType;
  nOutputArgs: number;
  language: string;
}): CondensationPlan {
  const steps = [
    {
      operation: CondensationOperations.MAP,
      params: {
        batchSize: mapPrompt.params.batchSize,
        condensationPrompt: mapPrompt.promptText,
        iterationPrompt: iterationPrompt.promptText
      } as MapOperationParams
    },
    {
      operation: CondensationOperations.REDUCE,
      params: {
        denominator: reducePrompt.params.denominator,
        coalescingPrompt: reducePrompt.promptText
      } as ReduceOperationParams
    }
  ];

  return {
    outputType: condensationType,
    steps,
    nOutputArgs,
    language
  };
}
