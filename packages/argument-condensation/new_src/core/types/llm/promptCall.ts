import { CondensationOperation } from '../condensation/operation';

/**
 * Represents an API call instance of a prompt.
 *
 * @param promptId - The ID of the prompt to call
 * @param operation - The operation this prompt is associated with
 * @param rawInputText - The raw input text for the prompt
 * @param rawOutputText - The raw output text for the prompt
 * @param model - The model to use for the prompt
 * @param timestamp - When this call was made
 * @param metadata - Token usage, latency, and cost information
 */
export interface PromptCall {
  promptId: string;
  operation: CondensationOperation;
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
    latency: number; // in milliseconds
    cost: number; // in USD (optional for backward compatibility)
  };
}
