import type { SegmentWithMetadata, SourceMetadata, SourceSegment } from '@openvaa/vector-store/types';
import type { Embedder } from './embedder.type';

/**
 * Configuration for vector store initialization
 * @example
 * ```typescript
 * {
 *   collectionName: 'my_collection',
 *   embedder: new OpenAIEmbedder({ model: 'text-embedding-3-small', dimensions: 1536 }),
 * }
 * ```
 */
export interface VectorStoreConfig {
  collectionName: string;
  embedder: Embedder;
  /** Optional ChromaDB server path (e.g., 'http://host.docker.internal:8000' for Docker) 
   * @default 
   * localhost:8000
   */
  chromaPath?: string;
}

/**
 * Result from vector search with enriched segments
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
 *   vectorSearchScore: 0.95,
 *   rerankScore: 0.98,
 *   distance: 0.1
 * }
 * ```
 */
export interface SingleSearchResult {
  /** Enriched segment with full analysis context */
  segment: SegmentWithMetadata;
  /** Original vector similarity score (higher is better, 0-1 range) */
  vectorSearchScore: number;
  /** Distance metric (lower is better) */
  distance: number;
  /** Reranking score (only present when reranking is enabled) */
  rerankScore?: number;
}

/**
 * Results from a vector search operation. Includes
 */
export interface VectorSearchResult {
  /** Segments found in the vector search */
  results: Array<SingleSearchResult>;
  /** Timestamp when search was performed */
  timestamp: number;
  /** Costs incurred from reranking (if enabled) */
  rerankingCosts?: { cost: number };
}

/**
 * Per-collection search configuration
 */
export interface VectorSearchConfig {
  /** Number of results to fetch */
  topK?: number;
}

/**
 * Configuration for Cohere reranking
 */
export interface RerankConfig {
  /** Enable reranking with Cohere */
  enabled: boolean;
  /** Cohere API key */
  apiKey: string;
  /** Reranking model to use (default: 'rerank-v3.5') */
  model?: string;
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
   * @param metadata - Metadata for the source document
   */
  abstract addSegments({
    segments,
    metadata
  }: {
    segments: Array<SourceSegment>;
    metadata: SourceMetadata;
  }): Promise<void>;

  /**
   * Delete segments by ID
   * @param ids - Array of segment IDs to delete
   */
  abstract delete(ids: Array<string>): Promise<void>;

  /**
   * Search for similar items in the vector store
   * @param query - Search query string or embedding vector
   * @param topK - Number of results to return
   * @returns Vector search results
   */
  abstract search({ query, topK }: { query: string; topK?: number }): Promise<VectorSearchResult>;
}
