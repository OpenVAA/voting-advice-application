import type { SegmentWithAnalysis, SourceMetadata } from '@openvaa/file-processing';
import type { EnrichedSegment, SegmentFact, SegmentSummary, SourceSegment } from '../types';

/**
 * Transforms SegmentWithAnalysis from file-processing into vector store format.
 * Splits single segment object into three embeddable types (segment, summary, facts)
 */
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
    segments.push({
      id: swa.id,
      parentDocId: documentId,
      segmentIndex: swa.segmentIndex,
      content: swa.segment,
      metadata
    });

    summaries.push({
      id: `${swa.id}_summary`,
      parentDocId: documentId,
      parentSegmentId: swa.id, // Critical for retrieval!
      segmentIndex: swa.segmentIndex,
      content: swa.summary,
      metadata
    });

    swa.standaloneFacts?.forEach((fact, idx) => {
      facts.push({
        id: `${swa.id}_fact_${idx}`,
        parentDocId: documentId,
        parentSegmentId: swa.id, // Critical for retrieval!
        segmentIndex: swa.segmentIndex,
        content: fact,
        metadata
      });
    });
  }

  return { segments, summaries, facts };
}

/**
 * Inverse transform: Reconstructs EnrichedSegment from vector store results.
 * Combines segments, summaries, and facts back into full analysis context.
 * @param segments - Array of original segments
 * @param summaries - Array of segment summaries (optional)
 * @param facts - Array of extracted facts (optional)
 * @returns Array of enriched segments with full analysis context
 */
export function reconstructSegmentWithAnalysis(
  segments: Array<SourceSegment>,
  summaries: Array<SegmentSummary> = [],
  facts: Array<SegmentFact> = []
): Array<EnrichedSegment> {
  // Group by segment ID
  const segmentMap = new Map<string, EnrichedSegment>();

  segments.forEach((seg) => {
    segmentMap.set(seg.id, {
      id: seg.id,
      parentDocId: seg.parentDocId,
      segment: seg.content,
      segmentIndex: seg.segmentIndex,
      summary: '', // Will be filled if summary exists
      standaloneFacts: [],
      metadata: seg.metadata
    });
  });

  summaries.forEach((sum) => {
    const segment = segmentMap.get(sum.parentSegmentId);
    if (segment) segment.summary = sum.content;
  });

  facts.forEach((fact) => {
    const segment = segmentMap.get(fact.parentSegmentId);
    if (segment) segment.standaloneFacts!.push(fact.content);
  });

  return Array.from(segmentMap.values());
}
