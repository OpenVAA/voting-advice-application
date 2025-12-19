import type { CommonLLMParams, LLMPipelineResult } from '@openvaa/llm-refactor';

/**
 * Options for converting PDF to markdown using Gemini API
 */
export interface ConvertPdfOptions extends CommonLLMParams {
  /** The PDF file as a Buffer */
  pdfBuffer: Buffer;
  /** Optional: Gemini API key. If not provided, will use env var */
  apiKey?: string;
  /** Optional: Model to use for conversion. Defaults to 'gemini-2.5-pro' */
  model?: string;
  /** Optional: Original filename for metadata */
  originalFileName?: string;
}

/**
 * Data payload for PDF to markdown conversion
 */
export interface ConvertPdfData {
  /** The converted markdown content */
  markdown: string;
}

/**
 * Result from PDF to markdown conversion
 */
export type ConvertPdfResult = LLMPipelineResult<ConvertPdfData>;
