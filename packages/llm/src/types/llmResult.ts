import type { GenerationMetrics } from './generationMetrics';

/**
 * Base result type for all LLM generation operations that are used via this package.
 * Not relevant for a single LLM call, rather a more abstract result that packages
 * generating data with LLMs use.
 * 
 * Contains common fields like runId, metrics, success status, and metadata
 * 
 * @template TData - The specific data payload for this result type
 */
export interface LLMResult<TData extends object> {
  /** Unique identifier for this generation run */
  runId: string;
  
  /** The specific data payload for this result */
  data: TData;
  
  /** Generation metrics */
  metrics: GenerationMetrics;
  
  /** Whether generation was successful */
  success: boolean;
  
  /** Metadata about the generation run */
  metadata: {
    llmModel: string;
    language: string;
    startTime: Date;
    endTime: Date;
  };
}