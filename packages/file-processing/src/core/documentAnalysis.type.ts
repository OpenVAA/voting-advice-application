import type { CommonLLMParams, LLMPipelineMetrics, LLMPipelineResult } from '@openvaa/llm';
import type { SourceMetadata, SourceSegment } from '@openvaa/vector-store/types';

/**
 * Options for analyzing a source and its segments
 * @example
 * ```typescript
 * const analyzeSourceOptions: AnalyzeSourceOptions = {
 *   text: 'This is a source',
 *   segments: ['This is a segment', 'This is a segment'],
 *   documentId: '1'
 *   llmProvider: 'gemini-2.5-flash-preview-09-2025'
 *   runId: '1',
 *   controller: new Controller()
 * }
 * ```
 */
export interface AnalyzeSourceOptions extends CommonLLMParams {
  /** The full source text (for metadata extraction using LLM) */
  text: string;
  /** Pre-segmented text chunks to analyze */
  segments: Array<string>;
  /** Optional: Source ID. If not provided, one will be generated */
  documentId?: string;
} // TODO: separate options and data (segments and text)

/**
 * Metrics specific to text analysis operations
 * Extends base llm metrics with analysis-specific fields
 * @example
 * ```typescript
 * const sourceAnalysisMetrics: SourceAnalysisMetrics = {
 *   nSegments: 10,
 *   nFactsExtracted: 100
 *   nLlmCalls: 10,
 *   costs: {
 *     total: 100,
 *     input: 50,
 *     output: 50
 *   },
 *   tokens: {
 *     totalTokens: 1000,
 *     inputTokens: 500,
 *     outputTokens: 500
 *   }
 *   processingTimeMs: 1000
 * }
 * ```
 */
export interface SourceAnalysisMetrics extends LLMPipelineMetrics {
  /** Number of segments analyzed */
  nSegments: number;
  /** Total number of facts extracted across all segments */
  nFactsExtracted: number;
}

/**
 * Data payload for document analysis results
 * @example
 * ```typescript
 * const analyzeSourceData: AnalyzeSourceData = {
 *   documentId: '1',
 *   sourceMetadata: {
 *     source: 'Source Name',
 *   },
 *   segmentAnalyses: [{
 *     id: '1',
 *     parentDocId: '1',
 *     segment: 'This is a segment',
 *     segmentIndex: 0,
 *     summary: 'This is a summary',
 *     standaloneFacts: ['This is a fact']
 *   }],
 *   metrics: {
 *     nSegments: 10,
 *     nFactsExtracted: 100,
 *     nLlmCalls: 10,
 *     costs: {
 *       total: 100,
 *       input: 50,
 *       output: 50
 *     },
 *     tokens: {
 *       totalTokens: 1000,
 *       inputTokens: 500,
 *       outputTokens: 500
 *     }
 *     processingTimeMs: 1000
 *   }
 *   processingMetadata: {
 *     segmentation: {
 *       nSegments: 10,
 *       nLlmCalls: 10,
 *       costs: {
 *         total: 100,
 *         input: 50,
 *         output: 50
 *       },
 *     }
 *     analysis: {
 *       nSegments: 10,
 *       nFactsExtracted: 100,
 *       nLlmCalls: 10,
 *       costs: {
 *         total: 100,
 *         input: 50,
 *         output: 50
 *       },
 *     }
 *     processingTimeMs: 1000
 *   }
 * }
 * ```
 */
export interface AnalyzeSourceData {
  /** Generated or provided source ID */
  documentId: string;
  sourceMetadata: SourceMetadata;
  /** Analysis results for each segment */
  segmentAnalyses: Array<SourceSegment>;
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
} // TODO: separate options and data (text)
