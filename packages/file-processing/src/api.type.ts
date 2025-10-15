import type { LLMPipelineMetrics, LLMPipelineResult } from '@openvaa/llm-refactor';
import type { SegmentWithAnalysis, SourceAnalysisMetrics, SourceMetadata } from './core/documentAnalysis.type';
import type { ConvertPdfOptions } from './core/pdfConversion.type';
import type { SegmentTextOptions, TextSegmentationMetrics } from './core/textSegmentation.type';

// ------------------------------------------------------------
// Base Processing Result Type
// ------------------------------------------------------------

interface BaseFileProcessingResultData {
  /** Generated or provided document ID */
  documentId: string;
  /** Extracted document metadata */
  metadata: SourceMetadata;
  /** Analysis results for each segment */
  segmentAnalyses: Array<SegmentWithAnalysis>;
  /** Processing metadata extending multi-stage pipeline metrics */
  processingMetadata: {
    /** Segmentation stage metadata */
    segmentation: TextSegmentationMetrics;
    /** Analysis stage metadata */
    analysis: SourceAnalysisMetrics;
  };
}

// ------------------------------------------------------------
// Text Processing Types
// ------------------------------------------------------------

export type ProcessTextOptions = SegmentTextOptions;

export type ProcessTextResult = LLMPipelineResult<BaseFileProcessingResultData>;

// ------------------------------------------------------------
// PDF Processing Types
// ------------------------------------------------------------

/**
 * Options for processing a PDF through the complete pipeline to from a fully segmentized and analyzed document. 
 */
export type ProcessPdfOptions = Omit<ProcessTextOptions, 'text'> & ConvertPdfOptions;

/**
 * Data payload for the result of processing a PDF through the complete pipeline
 */
export interface ProcessPdfResultData extends BaseFileProcessingResultData {
  /** The extracted markdown text from the PDF */
  extractedText: string;
  /** Processing metadata with PDF conversion stage */
  processingMetadata: BaseFileProcessingResultData['processingMetadata'] & {
    /** PDF conversion stage metadata */
    pdfConversion: LLMPipelineMetrics;
  };
}

export type ProcessPdfResult = LLMPipelineResult<ProcessPdfResultData>;
