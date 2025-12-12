import type { SegmentWithMetadata, SourceMetadata, SourceSegment } from '@openvaa/file-processing';

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
  const segmentsWithMetadata: Array<SegmentWithMetadata> = segments.map((s) => ({
    id: s.id,
    documentId: s.documentId,
    segmentIndex: s.segmentIndex,
    content: s.content,
    metadata
  }));

  return segmentsWithMetadata;
}
