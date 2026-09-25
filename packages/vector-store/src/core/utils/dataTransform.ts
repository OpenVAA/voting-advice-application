import type { SegmentWithMetadata, SourceMetadata, SourceSegment } from '../source.types';

/**
 * Adds document metadata to SourceSegment objects, transforming them into SegmentWithMetadata objects.
 *
 * @param segments - Array of SourceSegment objects to transform
 * @param metadata - Document metadata to add to the segments
 * @returns Array of SegmentWithMetadata objects
 */

export function enrichSegmentsWithMetadata({
  segments,
  metadata
}: {
  segments: Array<SourceSegment>;
  metadata: SourceMetadata;
}): Array<SegmentWithMetadata> {
  // Exclude authors array since ChromaDB only accepts scalar values (string, number, boolean)
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const { authors, ...chromaCompatibleMetadata } = metadata;
  const segmentsWithMetadata: Array<SegmentWithMetadata> = segments.map((s) => ({
    id: s.id,
    documentId: s.documentId,
    segmentIndex: s.segmentIndex,
    content: s.content,
    metadata: {
      ...chromaCompatibleMetadata,
      documentId: s.documentId,
      segmentIndex: s.segmentIndex
    }
  }));

  return segmentsWithMetadata;
}
