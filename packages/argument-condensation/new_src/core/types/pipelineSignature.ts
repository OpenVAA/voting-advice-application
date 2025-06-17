/**
 * Represents the signature of a pipeline with the IDs of the prompts used in each phase.
 * 
 * @param initialCondensationPromptId - The ID of the initial condensation prompt
 * @param mainCondensationPromptId - The ID of the main condensation prompt
 * @param argumentImprovementPromptId - The ID of the argument improvement prompt
 */
export interface PipelineSignature {
  initialCondensationPromptId: string;
  mainCondensationPromptId: string;
  argumentImprovementPromptId: string;
}

/**
 * Converts the pipeline signature to a string.
 * 
 * @param sig - The pipeline signature
 * @returns The string representation of the pipeline signature
 */
export function pipelineSignatureToString(sig: PipelineSignature): string {
  return [sig.initialCondensationPromptId, sig.mainCondensationPromptId, sig.argumentImprovementPromptId].join('-');
}