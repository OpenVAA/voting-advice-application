import type { SegmentWithAnalysis, SourceMetadata } from '@openvaa/file-processing';

/**
 * Base interface for embeddable content in vector store
 * All three types (segments, summaries, facts) share this structure
 */
interface EmbeddableBase {
  /** Unique identifier */
  id: string;
  /** Foreign key to parent document */
  parentDocId: string;
  /** Position of segment in the parent document */
  segmentIndex: number;
  /** The actual text content to embed - unified field for all types */
  content: string;
  /** Optional embedding vector (populated after embedding) */
  embedding?: Array<number>;
  /** Metadata about the source document */
  metadata: SourceMetadata;
}

/**
 * Original segment text for embedding and retrieval
 * Note: This is a semantic type alias. While it doesn't add new fields,
 * it provides type-level distinction between segments, summaries, and facts.
 * @example
 * ```typescript
 * const segment: SourceSegment = {
 *   id: 'doc1_seg0',
 *   parentDocId: 'doc1',
 *   segmentIndex: 0,
 *   content: 'The European Parliament is the legislative branch...',
 *   metadata: { source: 'EU Parliament', title: 'EU Guide' }
 * }
 * ```
 */
export type SourceSegment = EmbeddableBase;

/**
 * Summary of a segment for multi-vector retrieval
 * Linked back to parent segment via parentSegmentId
 * @example
 * ```typescript
 * const summary: SegmentSummary = {
 *   id: 'doc1_seg0_summary',
 *   parentDocId: 'doc1',
 *   parentSegmentId: 'doc1_seg0',
 *   segmentIndex: 0,
 *   content: 'Overview of EU Parliament structure and function',
 *   metadata: { source: 'EU Parliament', title: 'EU Guide' }
 * }
 * ```
 */
export interface SegmentSummary extends EmbeddableBase {
  /** Foreign key to parent segment - critical for multi-vector retrieval */
  parentSegmentId: string;
}

/**
 * Standalone fact extracted from a segment for multi-vector retrieval
 * Linked back to parent segment via parentSegmentId
 * @example
 * ```typescript
 * const fact: SegmentFact = {
 *   id: 'doc1_seg0_fact_0',
 *   parentDocId: 'doc1',
 *   parentSegmentId: 'doc1_seg0',
 *   segmentIndex: 0,
 *   content: 'The European Parliament has 705 members',
 *   metadata: { source: 'EU Parliament', title: 'EU Guide' }
 * }
 * ```
 */
export interface SegmentFact extends EmbeddableBase {
  /** Foreign key to parent segment - critical for multi-vector retrieval */
  parentSegmentId: string;
}

/**
 * Enriched segment returned from vector store search
 * Includes original segment, summary, and facts for full context
 * @example
 * ```typescript
 * const enriched: EnrichedSegment = {
 *   id: 'doc1_seg0',
 *   parentDocId: 'doc1',
 *   segment: 'The European Parliament is the legislative branch...',
 *   segmentIndex: 0,
 *   summary: 'Overview of EU Parliament structure',
 *   standaloneFacts: ['The European Parliament has 705 members'],
 *   metadata: { source: 'EU Parliament', title: 'EU Guide' }
 * }
 * ```
 */
export type EnrichedSegment = SegmentWithAnalysis & {
  metadata: SourceMetadata;
};
