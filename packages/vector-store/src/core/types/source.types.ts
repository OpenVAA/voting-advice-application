import type { Id } from '@openvaa/core';

/** INTERNAL TYPE FOR PROCESSING. Data is separated into segments, summaries, and facts objects for embedding 
 * 
 * @example
 * ```typescript
 * const segmentWithAnalysis: SegmentWithAnalysis = {
 *   id: '1',
 *   segment: 'This is a segment',
 *   segmentIndex: 0,
 *   summary: 'This is a summary',
 *   standaloneFacts: ['This is a fact']
 * }
 * const factObject: SegmentFact = {
 *   id: '1',
 *   parentSegmentId: '1',
 *   segmentIndex: 0,
 *   content: 'This is a fact extracted from the segment with id parentSegmentId',
 *   metadata: {'there': 'actually is metadata for these objects but i am just a placeholder!'}
 * }
 * ```
*/
export interface SegmentWithAnalysis {
  id: Id;
  parentDocId: string; // FK
  segment: string; // the segment itself
  segmentIndex: number;
  summary: string;
  standaloneFacts?: Array<string>;
}

/**  */
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
 * {
 *   id: '1',
 *   content: 'Hello, world!',
 *   metadata: {
 *     source: 'European Parliament',
 *     title: 'European Parliament Report X',
 *     link: 'https://www.google.com'
 *   }
 * }
 * ```
 */
export interface SourceDocument {
  id: string;
  content: string;
  metadata: SourceMetadata;
}

export interface SourceSegment {
  id: string;
  parentDocId: string; // FK
  segmentIndex: number; // In the parent document
  content: string;
  embedding?: Array<number>;
  metadata: SourceMetadata;
}

export interface SegmentSummary {
  id: string;
  parentSegmentId: string; // FK
  segmentIndex: number; // In the parent document
  content: string;
  embedding?: Array<number>;
  metadata: SourceMetadata;
}

export interface SegmentFact {
  id: string;
  parentSegmentId: string; // FK
  segmentIndex: number; // In the parent document
  content: string;
  embedding?: Array<number>;
  metadata: SourceMetadata;
}
