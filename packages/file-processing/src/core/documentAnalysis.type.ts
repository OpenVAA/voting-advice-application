import type { CommonLLMParams, LLMPipelineResult } from '@openvaa/llm-refactor';

/**
 * Document source metadata extracted by LLM
 */
export interface SourceMetadata {
  source?: string;
  title?: string;
  link?: string;
  authors?: Array<string>;
  publishedDate?: string;
  createdAt?: string;
  locale?: string;
}

/**
 * A source segment with its LLM-generated analysis
 */
export interface SegmentWithAnalysis {
  id: string;
  parentDocId: string;
  /** The actual text from the source. Derived from markdown with some formatting differences. */
  segment: string;
  /** Index of the segment in the source. Used for ordering. */
  segmentIndex: number;
  /** Summary that is embedded & searched separately. Helps find relevant segments. */
  summary: string;
  /** Extracted facts embedded & searched separately. Used to improve retrieval.
   * For model input, always use the original segment to prevent hallucination. */
  standaloneFacts?: Array<string>;
}

/**
 * Options for analyzing a source and its segments
 */
export interface AnalyzeSourceOptions extends CommonLLMParams {
  /** The full source text (for metadata extraction using LLM) */
  text: string;
  /** Pre-segmented text chunks to analyze */
  segments: Array<string>;
  /** Optional: Source ID. If not provided, one will be generated */
  sourceId?: string;
}

/**
 * Metrics specific to text analysis operations
 * Extends base pipeline metrics with analysis-specific fields
 */
export interface SourceAnalysisMetrics {
  /** Number of segments analyzed */
  nSegments: number;
  /** Total number of facts extracted across all segments */
  nFactsExtracted: number;
}

/**
 * Data payload for document analysis results
 */
export interface AnalyzeSourceData {
  /** Generated or provided source ID */
  sourceId: string;
  sourceMetadata: SourceMetadata;
  /** Analysis results for each segment */
  segmentAnalyses: Array<SegmentWithAnalysis>;
  /** Analysis metadata and metrics */
  metrics: SourceAnalysisMetrics;
}

/**
 * Result from document analysis containing metadata and segment analyses
 */
export type AnalyzeSourceResult = LLMPipelineResult<AnalyzeSourceData>;

/**
 * Options for extracting metadata from document text
 */
export interface ExtractMetadataOptions extends CommonLLMParams {
  /** The full document text to extract metadata from */
  text: string;
}
