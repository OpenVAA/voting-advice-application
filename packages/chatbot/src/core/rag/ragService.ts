import type { MultiVectorSearchResult } from '@openvaa/vector-store/types';
import type { RAGRetrievalInput, RAGRetrievalResult } from './ragService.type';

/**
 * Perform RAG retrieval for a user query
 *
 * This function:
 * 1. Reformulates the query into diverse variations (overcomes embedding space limitations)
 * 2. Performs multi-vector search across collections
 * 3. Optionally reranks results
 * 4. Formats context for LLM consumption
 *
 * Designed to be used as a tool - accepts simple query string and returns formatted context.
 *
 * @param input - RAG retrieval parameters
 * @returns RAG retrieval result with formatted context and metadata
 */
export async function performRAGRetrieval(input: RAGRetrievalInput): Promise<RAGRetrievalResult> {
  const startTime = Date.now();

  // STEP 1: Perform vector search with reformulated queries
  const searchResult = await input.vectorStore.search({
    queries: { [input.query]: [input.query] }, // Single query and single topic, though the vector store can handle multiple queries and topics
    nResultsTarget: input.nResultsTarget ?? 10,
    searchCollections: ['segment', 'summary', 'fact'],
    searchConfig: {}, // Use defaults from multiVectorStore
    rerankConfig: input.rerankConfig
  });

  // STEP 3: Format context for LLM
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
 * Only includes actual segment text, not AI-generated summaries/facts
 *
 * @param searchResult - Vector search result
 * @returns Formatted context string
 */
export function formatRAGContext(searchResult: MultiVectorSearchResult): string {
  if (searchResult.results.length === 0) {
    return 'No relevant context found.';
  }

  return searchResult.results
    .map((result) => {
      const source = result.segment.metadata.source || 'Unknown';
      return `### Source: ${source}\n${result.segment.segment}`;
    })
    .join('\n\n---\n\n');
}