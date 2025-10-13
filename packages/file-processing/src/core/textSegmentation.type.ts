import type { LLMModelConfig, LLMProvider } from '@openvaa/llm-refactor';

export interface SegmentationOptions {
  /** The text to segment */
  text: string;
  /** LLM provider instance for making API calls */
  llmProvider: LLMProvider;
  /** Model configuration */
  modelConfig: LLMModelConfig;
  /** Optional: Validate text preservation (default: true) */
  validatePreservation?: boolean;
}

export interface SegmentationResult {
  /** Array of text segments */
  segments: Array<string>;
  /** Segmentation metadata */
  metadata: {
    segmentCount: number;
    totalCharacters: number;
    averageSegmentLength: number;
    costs: {
      total: number;
      currency: 'USD';
    };
  };
}