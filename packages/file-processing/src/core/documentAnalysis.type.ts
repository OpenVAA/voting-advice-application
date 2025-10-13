import type { LLMModelConfig, LLMProvider } from '@openvaa/llm-refactor';

export interface SourceMetadata {
  source?: string;
  title?: string;
  link?: string;
  authors?: Array<string>;
  publishedDate?: string;
  createdAt?: string;
  locale?: string;
}

export interface SegmentWithAnalysis {
  id: string;
  parentDocId: string;
  segment: string;
  segmentIndex: number;
  summary: string;
  standaloneFacts?: Array<string>;
}

export interface DocumentAnalysisOptions {
  /** The full document text (for metadata extraction) */
  fullText: string;
  /** Pre-segmented text chunks */
  segments: Array<string>;
  /** LLM provider instance */
  llmProvider: LLMProvider;
  /** Model configuration */
  modelConfig: LLMModelConfig;
  /** Optional: Document ID. If not provided, one will be generated */
  documentId?: string;
}

export interface DocumentAnalysisResult {
  /** Generated or provided document ID */
  documentId: string;
  /** Extracted document metadata */
  metadata: SourceMetadata;
  /** Analysis results for each segment */
  segmentAnalyses: Array<SegmentWithAnalysis>;
  /** Processing metadata */
  processingMetadata: {
    segmentsAnalyzed: number;
    summariesGenerated: number;
    factsExtracted: number;
    costs: {
      total: number;
      perSegmentAverage: number;
      currency: 'USD';
    };
    processingTimeMs: number;
  };
}