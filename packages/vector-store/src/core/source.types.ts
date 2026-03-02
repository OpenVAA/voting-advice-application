/**
 * Document source metadata extracted by LLM
 * @example
 * ```typescript
 * const sourceMetadata: SourceMetadata = {
 *   source: 'Source Name',
 *   title: 'Source Title',
 *   link: 'https://source.com',
 *   authors: ['Author 1', 'Author 2'],
 *   publishedDate: '2021-01-01',
 *   createdAt: '2021-01-01',
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

/**
 * A source segment with its LLM-generated analysis
 * @example
 * ```typescript
 * const segmentWithAnalysis: SegmentWithAnalysis = {
 *   id: '1',
 *   parentDocId: '1',
 *   segment: 'This is a segment',
 *   segmentIndex: 0,
 *   summary: 'This is a summary',
 *   standaloneFacts: ['This is a fact']
 * }
 * ```
 */
export interface SourceSegment {
  id: string; // TODO: is the openvaa standard to use Id for all ids?
  documentId: string;
  /** The actual text from the source. Derived from markdown with some formatting differences. */
  content: string;
  /** Index of the segment in the source. Used for ordering. */
  segmentIndex: number;
  /** Summary of the segment */
  summary?: string;
  /** Facts extracted from the segment */
  standaloneFacts?: Array<string>;
}

/** A source segment with its document metadata.  */
export interface SegmentWithMetadata extends SourceSegment {
  metadata: SourceMetadata;
}
