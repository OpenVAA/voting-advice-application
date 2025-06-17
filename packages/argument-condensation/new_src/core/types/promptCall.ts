import type { CondensationPhase } from './condensationPhase';

/**
 * Represents an API call instance of a prompt.
 * 
 * @param promptId - The ID of the prompt to call
 * @param phase - The phase of the condensation pipeline this prompt call is for
 * @param rawInputText - The raw input text for the prompt
 * @param rawOutputText - The raw output text for the prompt
 * @param model - The model to use for the prompt
 * @param timestamp - When this call was made
 * @param metadata - Token usage and latency
 */
export interface PromptCall {
  promptId: string;
  phase: CondensationPhase;
  rawInputText: string;
  rawOutputText: string;
  model: string;
  timestamp: string;
  metadata: {
    tokens: {
      input: number;
      output: number;
      total: number;
    };
    latency: number;
  };
}

