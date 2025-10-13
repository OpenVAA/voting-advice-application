import type { LLMModelConfig, LLMProvider } from '@openvaa/llm-refactor';
import type { DocumentAnalysisResult } from './core/documentAnalysis.type';

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
  validatePreservation?: boolean;
}

/** Result type is the same as DocumentAnalysisResult */
export type DocumentProcessingResult = DocumentAnalysisResult;
