import type { LLMModelConfig, LLMProvider } from '@openvaa/llm-refactor';
import type { TextAnalysisResult } from './core/documentAnalysis.type';

export interface TextPreProcessingOptions {
  /** The document content (markdown/text) */
  text: string;
  /** LLM provider instance */
  llmProvider: LLMProvider;
  /** Model configuration */
  modelConfig: LLMModelConfig;
  /** Optional: Document ID */
  documentId?: string;
  /** Optional: Validate text preservation during segmentation (TODO: implement) */
  validateTextPreservation?: boolean;
  /** Optional: Minimum segment length */
  minSegmentLength?: number;
  /** Optional: Maximum segment length */
  maxSegmentLength?: number;
  /** Optional: Chars per LLM call */
  charsPerLLMCall?: number;
}

/** Result type is the same as TextAnalysisResult */
export type TextPreProcessingResult = TextAnalysisResult;

export interface PdfPreProcessingOptions extends TextPreProcessingOptions {
  /** The PDF file as a Buffer */
  pdfBuffer: Buffer;
  /** Optional: Gemini API key. If not provided, will use env var */
  apiKey?: string;
  /** Optional: Model to use for conversion. Defaults to 'gemini-2.5-pro' */
  model?: string;
  /** Optional: Original filename for metadata */
  originalFileName?: string;
};

export type PdfPreProcessingResult = Omit<TextPreProcessingResult, 'processingMetadata'> & {
  extractedText: string;
  extractionMetadata: {
    processingTime: number;
    modelUsed: string;
    costs: {
      input: number;
      output: number;
      total: number;
    };
  }
}