import { CohereClientV2 } from 'cohere-ai';
import type { SingleSearchResult } from '../vectorStore.type';
import type { RerankParams, RerankResult } from './rerank.types';

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
  const documents = retrievedSegments.map((seg) => seg.segment.content);

  // Call Cohere rerank API
  const response = await cohere.rerank({
    model,
    query,
    documents,
    topN: nBest
  });

  // Map results back to enriched segments with scores
  const rerankedSegments: Array<SingleSearchResult> = [];
  const scores = new Map<string, number>();

  for (const result of response.results) {
    const originalSegment = retrievedSegments[result.index];
    if (originalSegment) {
      rerankedSegments.push({
        segment: originalSegment.segment,
        vectorSearchScore: originalSegment.vectorSearchScore,
        distance: originalSegment.distance,
        rerankScore: result.relevanceScore
      });
      scores.set(originalSegment.segment.id, result.relevanceScore);
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
