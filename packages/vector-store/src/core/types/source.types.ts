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
  parentId: string; // FK
  content: string;
  embedding?: Array<number>;
  metadata: SourceMetadata;
}

export interface SegmentSummary {
  id: string;
  parentSegmentId: string; // FK
  content: string;
  embedding?: Array<number>;
  metadata: SourceMetadata;
}
