import type { Embedder } from './embedder.type';
import type { SourceSegment } from './types';

/** @example
 * ```typescript
 * {
 *   collectionName: 'my_collection',
 *   embedder: new OpenAIEmbedder({ model: 'text-embedding-3-small', dimensions: 1536 }),
 *   persistDirectory: './chroma_data'
 * }
 * ```
 */
export interface VectorStoreConfig {
  collectionName: string;
  embedder: Embedder;
  persistDirectory?: string;
}

/** @example
 * ```typescript
 * {
 *   document: { id: '1', content: 'Hello, world!', embedding: [0.1, 0.2, 0.3] },
 *   score: 0.95,
 *   distance: 0.1
 * }
 * ```
 */
export interface SearchResult {
  segment: SourceSegment;
  score: number;
  distance: number;
}

/** @example
 * ```typescript
 * {
 *   initialize: async () => {},
 *   addTexts: async (texts: Array<TextSegment>) => {},
 *   search: async (query: string) => {},
 *   delete: async (ids: Array<string>) => {}
 * }
 * ```
 */
export abstract class VectorStore {
  abstract initialize(): Promise<void>;
  abstract addTexts(texts: Array<SourceSegment>): Promise<void>;
  abstract search(query: string): Promise<Array<SearchResult>>;
  abstract delete(ids: Array<string>): Promise<void>;
}
