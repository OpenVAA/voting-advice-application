import { CondensationOperation } from '../condensation/operation';

/**
 * Represents an API call instance of a prompt.
 */
export interface PromptCall {
  /** The unique identifier for this prompt call */
  promptId: string;
  /** The operation this prompt is associated with */
  operation: CondensationOperation;
  /** The raw input text for the prompt */
  rawInputText: string;
  /** The raw output text for the prompt */
  rawOutputText: string;
  /** The model to use for the prompt */
  model: string;
  /** When this call was made */
  timestamp: string;
  /** Metadata about the prompt call */
  metadata: {
    /** The number of tokens used for the prompt */
    tokens: {
      input: number;
      output: number;
      total: number;
    };
    /** The latency of the prompt (ms) */
    latency: number;
    /** The cost of the prompt ($) */
    cost: number;
  };
}
