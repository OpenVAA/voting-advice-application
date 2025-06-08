import { Argument } from './argument';
import { CondensationSessionInput } from './condensationInput';

/**
 * Performance metrics for evaluating condensation quality and efficiency.
 */
export interface CondensationSessionMetrics {
  /** Total processing time in seconds */
  duration: number;
  
  /** Number of LLM API calls made */
  nLlmCalls: number;

  /** Cost in EUR */
  cost: number;

  /** Tokens used */
  tokensUsed: {
    /** Input tokens used */
    inputs: number;

    /** Output tokens used */
    outputs: number;
  
    /** Total tokens used (input + output) */
    total: number;
  }
};

/**
 * Complete result of a condensation session.
 * Contains arguments, metadata, and evaluation metrics.
 */
export interface CondensationSessionResult {
  /** Unique identifier for this session */
  sessionId: string;
  
  /** Input parameters used for this session */
  input: CondensationSessionInput;
  
  /** Extracted arguments */
  arguments: Argument[];
  
  /** Performance and quality metrics */
  metrics: CondensationSessionMetrics;
  
  /** Success status */
  success: boolean;

  /** Additional metadata for evaluation and debugging */
  metadata: {
    /** LLM model used */
    llmModel: string;
    
    /** Language configuration used */
    language: string;

    /** Timestamp when processing started */
    startTime: Date;
    
    /** Timestamp when processing completed */
    endTime: Date;
  };
} 