import { PromptRegistry } from '../prompts/promptRegistry';
import { CondensationOperations, MapOperationParams, ProcessingStep, ReduceOperationParams } from '../types';
import { MapPrompt, ReducePrompt } from '../types/llm/prompt';

/**
 * Defines the steps for a condensation operation.
 * @param mapPrompt - The map prompt for the condensation operation.
 * @param reducePrompt - The reduce prompt for the condensation operation.
 * @param iterationPrompt - The iteration prompt for the condensation operation.
 * @returns An array of processing steps for the condensation operation.
 */
export async function createCondensationSteps(
  mapPromptId: string,
  mapIterationPromptId: string,
  reducePromptId: string,
  language: string
): Promise<Array<ProcessingStep>> {
  const promptRegistry = await PromptRegistry.create(language);

  const mapPrompt = promptRegistry.getPrompt(mapPromptId) as MapPrompt;
  const mapIterationPrompt = promptRegistry.getPrompt(mapIterationPromptId) as MapPrompt;
  const reducePrompt = promptRegistry.getPrompt(reducePromptId) as ReducePrompt;

  // TODO: implement actual calculation of batch size and denominator
  return [
    {
      operation: CondensationOperations.MAP,
      params: {
        batchSize: 2,
        condensationPrompt: mapPrompt.promptText,
        iterationPrompt: mapIterationPrompt.promptText
      } as MapOperationParams
    },
    {
      operation: CondensationOperations.REDUCE,
      params: {
        denominator: 2,
        coalescingPrompt: reducePrompt.promptText
      } as ReduceOperationParams
    }
  ];
}