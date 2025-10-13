import type { LLMModelConfig, LLMProvider } from '@openvaa/llm-refactor';
import type { TextAnalysisResult } from './core/documentAnalysis.type';

export interface DocumentProcessingOptions {
  /** The document content (markdown/text) */
  text: string;
  /** LLM provider instance */
  llmProvider: LLMProvider;
  /** Model configuration */
  modelConfig: LLMModelConfig;
  /** Optional: Document ID */
  documentId?: string;
  /** Optional: Validate text preservation during segmentation (default: true) */
  validateTextPreservation?: boolean;
  /** Optional: Minimum segment length */
  minSegmentLength?: number;
  /** Optional: Maximum segment length */
  maxSegmentLength?: number;
  /** Optional: Chars per LLM call */
  charsPerLLMCall?: number;
}

/** Result type is the same as DocumentAnalysisResult */
export type DocumentProcessingResult = TextAnalysisResult;
