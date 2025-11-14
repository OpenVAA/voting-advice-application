import { CohereClientV2 } from 'cohere-ai';
import type { EnrichedSegment } from '../types/source.types';

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
  retrievedSegments: Array<EnrichedSegment>;
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
  segments: Array<EnrichedSegment>;
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

/**
 * Rerank retrieved segments using Cohere's reranking model
 *
 * @param params - Reranking parameters
 * @returns Reranked segments with scores
 *
 * @example
 * ```typescript
 * const result = await rerank({
 *   query: "What is the European Parliament?",
 *   retrievedSegments: segments,
 *   nBest: 5,
 *   apiKey: process.env.COHERE_API_KEY
 * });
 * console.log(result.segments); // Top 5 most relevant segments
 * console.log(result.scores.get(segment.id)); // Get score for specific segment
 * ```
 */
export async function rerank(params: RerankParams): Promise<RerankResult> {
  const { query, retrievedSegments, nBest, apiKey, model = 'rerank-v3.5' } = params;

  // Initialize Cohere client
  const cohere = new CohereClientV2({
    token: apiKey
  });

  // Extract text content from segments for reranking
  // Use the original segment text as the primary content for reranking
  const documents = retrievedSegments.map((seg) => seg.segment);

  // Call Cohere rerank API
  const response = await cohere.rerank({
    model,
    query,
    documents,
    topN: nBest
  });

  // Map results back to enriched segments with scores
  const rerankedSegments: Array<EnrichedSegment> = [];
  const scores = new Map<string, number>();

  for (const result of response.results) {
    const originalSegment = retrievedSegments[result.index];
    if (originalSegment) {
      rerankedSegments.push(originalSegment);
      scores.set(originalSegment.id, result.relevanceScore);
    }
  }

  // Extract metadata from response
  const metadata = {
    searchUnits: response.meta?.billedUnits?.searchUnits,
    inputTokens: response.meta?.billedUnits?.inputTokens,
    outputTokens: response.meta?.billedUnits?.outputTokens
  };

  return {
    segments: rerankedSegments,
    scores,
    metadata
  };
}
