import type { SourceExcerpt } from '../types';

/**
 * Interface for segmenting SourceDocuments into TextSegments
 *
 * Different implementations can have completely different approaches:
 * - Character-based segmentation
 * - Token-based segmentation
 * - Semantic segmentation (e.g., by paragraphs, sentences, or meaning)
 * - Hybrid approaches
 *
 * @example
 * ```typescript
 * const segmenter: Segmenter = new CharacterSegmenter({
 *   maxLength: 1000,
 *   overlap: 100
 * });
 *
 * const segments = segmenter.segment(sourceDoc);
 * ```
 */
export interface Segmenter {
  /**
   * Segments a single SourceDocument into an array of TextSegments
   * @param document The source document to segment
   * @returns Array of text segments with unique IDs and empty embeddings
   */
  segment(document: string): Array<SourceExcerpt>;

  /**
   * Segments multiple SourceDocuments
   * @param documents Array of source documents to segment
   * @returns Flattened array of all text segments
   */
  segmentBatch(documents: Array<string>): Array<SourceExcerpt>;
}
