import type { SegmentFact, SegmentSummary, SegmentWithAnalysis, SourceMetadata, SourceSegment } from '../types';

export function transformToVectorStoreFormat(
  segmentsWithAnalysis: Array<SegmentWithAnalysis>,
  documentId: string,
  metadata: SourceMetadata
): {
  segments: Array<SourceSegment>;
  summaries: Array<SegmentSummary>;
  facts: Array<SegmentFact>;
} {
  const segments: Array<SourceSegment> = [];
  const summaries: Array<SegmentSummary> = [];
  const facts: Array<SegmentFact> = [];

  for (const swa of segmentsWithAnalysis) {
    // Create segment
    segments.push({
      id: swa.id,
      parentDocId: documentId,
      segmentIndex: swa.segmentIndex,
      content: swa.segment,
      metadata
    });

    // Create summary
    summaries.push({
      id: `${swa.id}_summary`,
      parentSegmentId: swa.id,
      segmentIndex: swa.segmentIndex,
      content: swa.summary,
      metadata
    });

    // Create facts (only if they exist)
    swa.standaloneFacts?.forEach((fact, idx) => {
      facts.push({
        id: `${swa.id}_fact_${idx}`,
        parentSegmentId: swa.id,
        segmentIndex: swa.segmentIndex,
        content: fact,
        metadata
      });
    });
  }

  return { segments, summaries, facts };
}
