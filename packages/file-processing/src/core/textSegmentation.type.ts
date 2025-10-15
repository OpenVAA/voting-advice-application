import type { CommonLLMParams, LLMPipelineMetrics, LLMPipelineResult } from '@openvaa/llm-refactor';

/**
 * Options for segmenting text into logical chunks using LLM
 */
export interface SegmentTextOptions extends CommonLLMParams {
  /** The text to segment */
  text: string;
  /** Optional: Document ID */
  documentId?: string;
  /** To prevent context window issues, we split text into chunks of this size */
  charsPerLLMCall?: number;
  /** Guidance for minimum segment length */
  minSegmentLength?: number;
  /** Guidance for maximum segment length */
  maxSegmentLength?: number;
  /** Optional: Validate text preservation (default: true) */
  validateTextPreservation?: boolean;
}

/**
 * Metrics specific to text segmentation operations
 * Extends base llm metrics with segmentation-specific fields
 */
export interface TextSegmentationMetrics extends LLMPipelineMetrics {
  /** Number of segments created */
  segmentCount: number;
  /** Total characters in the input text */
  totalCharacters: number;
  /** Minimum segment length achieved */
  minSegmentLength: number;
  /** Maximum segment length achieved */
  maxSegmentLength: number;
  /** Average segment length */
  averageSegmentLength: number;
  /** Array of individual segment lengths for detailed analysis */
  segmentLengths: Array<number>;
}

/**
 * Data payload for text segmentation result
 */
export interface SegmentTextData {
  /** Array of text segments */
  segments: Array<string>;
  /** Segmentation metadata and metrics */
  metrics: TextSegmentationMetrics;
}

/**
 * Result from text segmentation
 */
export type SegmentTextResult = LLMPipelineResult<SegmentTextData>;
