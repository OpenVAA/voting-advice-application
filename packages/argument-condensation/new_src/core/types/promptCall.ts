/**
 * Represents an API call instance of a prompt.
 * 
 * @param promptId - The ID of the prompt to call
 * @param inputHash - The hash of the input variables for the prompt
 * @param rawInputText - The raw input text for the prompt
 * @param rawOutputText - The raw output text for the prompt
 * @param model - The model to use for the prompt
 */
export interface PromptCall {
  promptId: string;
  inputHash: string;
  rawInputText: string;
  rawOutputText: string;
  model: string;
}

