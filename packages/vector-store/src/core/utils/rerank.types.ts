import type { SegmentWithMetadata } from '../source.types';

/**
 * Cohere Rerank API Pricing
 * - Search units are billed based on the number of segments to be reranked.
 */

/**
 * Parameters for the rerank function
 */
export interface RerankParams {
  /** The search query used for retrieval */
  query: string;
  /** Array of segments to rerank */
  retrievedSegments: Array<SegmentWithMetadata>;
  /** Number of top results to return */
  nBest: number;
  /** API key for Cohere */
  apiKey: string;
  /** Reranking model to use (default: 'rerank-v3.5') */
  model?: string;
}

/**
 * Result from reranking operation
 */
export interface RerankResult {
  /** Reranked segments in order of relevance */
  segments: Array<SegmentWithMetadata>;
  /** Map of segment IDs to their relevance scores */
  scores: Map<string, number>;
  /** Metadata about the reranking operation */
  metadata: {
    /** Search units billed by Cohere */
    searchUnits?: number;
    /** Input tokens used */
    inputTokens?: number;
    /** Output tokens used */
    outputTokens?: number;
  };
}