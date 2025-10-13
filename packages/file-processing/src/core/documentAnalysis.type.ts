import type { LLMModelConfig, LLMProvider } from '@openvaa/llm-refactor';

/** @example
 *
 * ```typescript
 * {
 *   source: 'The source of the document',
 *   title: 'The title of the document',
 *   link: 'The link to the document',
 *   authors: ['The authors of the document'],
 *   publishedDate: 'The published date of the document',
 *   createdAt: 'The created date of the document',
 *   locale: 'en-US'
 * }
 * ```
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

/** @example
 * ```typescript
 *
 * {
 *   id: '1',
 *   parentDocId: '1',
 *   segment: 'This is a segment with some text',
 *   segmentIndex: 0,
 *   summary: 'This is a summary of the segment',
 *   standaloneFacts: ['This is a fact'] // optional
 * }
 * ```
 */
export interface SegmentWithAnalysis {
  id: string;
  parentDocId: string;
  /** The actual text from the document. It is derived from the markdown text, so it has some formatting differences
   * compared to the original source file. */
  segment: string;
  /** Index of the segment in the document. Used for ordering the segments. */
  segmentIndex: number;
  /** Summary that is embedded & searched separately from the actual segment.
   * Summaries can help us find the segments that are relevant to a query.
   */
  summary: string;
  /** Extracted facts can help us find the segments that are relevant to a query. Extracted directly from the segment.
   * Embedded & searched separately from the actual segment. Used to improve the retrieval. For model input, always use
   * the original excerpt to prevent hallucinated facts and ensuring direct verifiability via source material.
   */
  standaloneFacts?: Array<string>;
}

/** @example
 * ```typescript
 * {
 *   fullText: 'The full document text', // for metadata extraction
 *   segments: ['The pre-segmented text chunks'],
 *   llmProvider: 'The LLM provider',
 *   modelConfig: 'The model configuration',
 *   documentId: 'The document ID'
 * }
 * ```
 */
export interface DocumentAnalysisOptions {
  /** The full document text (for metadata extraction using LLM) */
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
