import type { SegmentWithAnalysis, SourceMetadata } from '@openvaa/file-processing';
import type { LLMProvider } from '@openvaa/llm-refactor';
import type { CostBreakdown } from '@openvaa/core';
import type { Embedder } from './embedder.type';
import type { EnrichedSegment } from './types';

/**
 * Configuration for vector store initialization
 * @example
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
  collectionType: 'segment' | 'summary' | 'fact';
  embedder: Embedder;
  persistDirectory?: string;
  /** Optional ChromaDB server path (e.g., 'http://host.docker.internal:8000' for Docker) */
  chromaPath?: string;
}

/**
 * Generic search result
 */
export interface SearchResult<TItem = unknown> {
  /** The retrieved item */
  item: TItem;
  /** Similarity score (higher is better, 0-1 range) */
  score: number;
  /** Distance metric (lower is better) */
  distance: number;
}

/**
 * Result from multi-vector search with enriched segments
 * @example
 * ```typescript
 * {
 *   segment: {
 *     id: 'doc1_seg0',
 *     segment: 'The European Parliament...',
 *     summary: 'Overview of EU Parliament',
 *     standaloneFacts: ['705 members'],
 *     metadata: { source: 'EU Parliament' }
 *   },
 *   score: 0.95,
 *   distance: 0.1,
 *   foundWith: 'summary'
 * }
 * ```
 */
export interface EnrichedSearchResult {
  /** Enriched segment with full analysis context */
  segment: EnrichedSegment;
  /** Similarity score (higher is better, 0-1 range) */
  score: number;
  /** Distance metric (lower is better) */
  distance: number;
  /** Which collection found this result */
  foundWith: 'segment' | 'summary' | 'fact';
  /** Optional fact that was found */
  factFound?: string;
}

/**
 * Result from multi-vector search across segments, summaries, and facts
 */
export interface MultiVectorSearchResult {
  /** The search query that produced these results */
  query: string;
  /** Deduplicated and enriched results */
  results: Array<EnrichedSearchResult>;
  /** Statistics about where results came from */
  retrievalSources: {
    fromSegments: number;
    fromSummaries: number;
    fromFacts: number;
  };
  /** Timestamp when search was performed */
  timestamp: number;
  /** Costs incurred from intelligent filtering (if enabled) */
  filteringCosts?: CostBreakdown;
}

/**
 * Options for multi-vector search
 */
export interface MultiVectorSearchOptions {
  /** The query string to search for */
  query: string;
  /** Which collections to search (default: all) */
  searchCollections?: Array<'segment' | 'summary' | 'fact'>;
  /** Number of results to fetch from each collection */ 
  topKPerCollection?: number; // TODO: make this more configurable, allow for different strategies
  /** Function to generate query variations */
  getQueryVariations?: (query: string) => Array<string>; // TODO: implement a default utility for this
  /** Enable intelligent filtering using LLM */
  intelligentSearch?: boolean;
  /** LLM provider for intelligent filtering */
  llmProvider?: LLMProvider;
}

/**
 * Configuration for MultiVectorStore
 */
export interface MultiVectorStoreConfig {
  /** Collection names for each type */
  collectionNames: {
    segments: string;
    summaries: string;
    facts: string;
  };
  /** Embedder for all collections (if same) */
  embedder?: Embedder;
  /** Individual embedders per collection (overrides embedder) */
  embedders?: {
    segments?: Embedder;
    summaries?: Embedder;
    facts?: Embedder;
  };
  /** Optional persist directory */
  persistDirectory?: string;
  /** Optional ChromaDB server path (e.g., 'http://host.docker.internal:8000' for Docker) */
  chromaPath?: string;
}

/**
 * Abstract base class for vector stores
 * Low-level interface for single-collection operations
 */
export abstract class VectorStore {
  /** Initialize the vector store (connect to database, create collections, etc.) */
  abstract initialize(): Promise<void>;

  /**
   * Add analyzed segments to the vector store
   * @param segments - Array of segments with analysis
   * @param documentId - ID of the parent document
   * @param metadata - Metadata for the source document
   */
  abstract addAnalyzedSegments(
    segments: Array<SegmentWithAnalysis>,
    documentId: string,
    metadata: SourceMetadata
  ): Promise<void>;

  /**
   * Delete segments by ID
   * @param ids - Array of segment IDs to delete
   */
  abstract delete(ids: Array<string>): Promise<void>;

  /**
   * Search for similar items in the vector store
   * @param query - Search query string or embedding vector
   * @param topK - Number of results to return
   * @returns Array of search results with similarity scores
   */
  abstract search(query: string, topK?: number): Promise<Array<SearchResult<unknown>>>;
}
