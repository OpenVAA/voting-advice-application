import type { VectorSearchResult } from '@openvaa/vector-store/types';
import type { RAGRetrievalInput, RAGRetrievalResult } from './ragService.type';

/**
 * Perform RAG retrieval for a user query
 *
 * This function:
 * 1. Performs vector search to find relevant segments
 * 2. Optionally reranks results
 * 3. Formats context for LLM consumption
 *
 * Designed to be used as a tool - accepts simple query string and returns formatted context.
 *
 * @param input - RAG retrieval parameters
 * @returns RAG retrieval result with formatted context and metadata
 */
export async function performRAGRetrieval(input: RAGRetrievalInput): Promise<RAGRetrievalResult> {
  const startTime = Date.now();

  // STEP 1: Perform vector search
  const searchResult = await input.vectorStore.search({
    query: input.query,
    topK: input.nResultsTarget ?? 10
  });

  // STEP 2: Format context for LLM
  const formattedContext = formatRAGContext(searchResult);

  const durationMs = Date.now() - startTime;

  return {
    searchResult,
    segmentsUsed: searchResult.results.length,
    formattedContext,
    reformulatedQueries: { [input.query]: [input.query] },
    canonicalQuery: input.query,
    rerankingCosts: searchResult.rerankingCosts,
    durationMs
  };
}

/**
 * Format RAG search results for LLM prompt
 * Includes segment text from the vector store
 *
 * @param searchResult - Vector search result
 * @returns Formatted context string
 */
export function formatRAGContext(searchResult: VectorSearchResult): string {
  if (searchResult.results.length === 0) {
    return 'No relevant context found.';
  }

  return searchResult.results
    .map((result) => {
      const source = result.segment.metadata.source || 'Unknown';
      return `### Source: ${source}\n${result.segment.content}`;
    })
    .join('\n\n---\n\n');
}