import { rerank } from '@openvaa/vector-store';
import type { SingleSearchResult } from '@openvaa/vector-store/types';
import type { RAGRetrievalInput, RAGRetrievalResult } from './ragService.type';

// TODO: replace with agentic RAG retrieval
const RERANK_COST_PER_UNIT = 0.002; // Cohere pricing, see Cohere docs for more details on what a search unit is
const TOP_K_FROM_VECTOR_SEARCH = 85; // Setting this close to 100 leads to two search units billed from Cohere (not entirely sure why, maybe some segments are counted twice because they are too long, or something like that?)
const N_SEGMENTS_TO_RETURN = 5; // This is the max number of segments we can return to the LLM. We can also return 0 if no relevant segments are found. Arbitrary const, not tested further. TODO: make dynamic based on query complexity.
const MIN_RERANK_SCORE = 0.75; // Usually below this score results become irrelevant. Heuristic.

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

  console.info('[performRAGRetrieval] Performing RAG retrieval with query:', input.query);
  // STEP 1: Perform vector search
  let searchResult = await input.vectorStore.search({
    query: input.query,
    topK: TOP_K_FROM_VECTOR_SEARCH
  });

  // STEP 2: Optionally rerank results
  let rerankingCosts: { cost: number } | undefined;
  if (input.rerankConfig?.enabled && searchResult.results.length > 0) {
    const rerankingResult = await rerank({
      query: input.query,
      retrievedSegments: searchResult.results,
      nBest: input.nResultsTarget ?? N_SEGMENTS_TO_RETURN,
      apiKey: input.rerankConfig.apiKey
    });

    // Filter results by rerank score
    const filteredResults = rerankingResult.segments.filter(
      (result) => result.rerankScore !== undefined && result.rerankScore >= MIN_RERANK_SCORE
    );
    // Update searchResult with filtered results
    searchResult = {
      ...searchResult,
      results: filteredResults
    };

    // Calculate reranking cost from metadata
    rerankingCosts = {
      cost: (rerankingResult.metadata.searchUnits ?? 0) * RERANK_COST_PER_UNIT // Cohere pricing
    };
  } else {
    // Fallback if no reranking: get top N using vector search score
    // TODO: optimize this to use a heap or other data structure
    searchResult.results = searchResult.results
      .sort((a, b) => b.vectorSearchScore - a.vectorSearchScore)
      .slice(0, N_SEGMENTS_TO_RETURN);
  }

  // STEP 3: Format context for LLM
  const formattedContext = formatRAGContext(searchResult.results);
  const durationMs = Date.now() - startTime;

  return {
    searchResult,
    segmentsUsed: searchResult.results.length,
    formattedContext,
    reformulatedQueries: { [input.query]: [input.query] },
    canonicalQuery: input.query,
    rerankingCosts,
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
export function formatRAGContext(searchResults: Array<SingleSearchResult>): string {
  if (searchResults.length === 0) {
    return 'No relevant context found.';
  }

  return searchResults
    .map((result) => {
      const source = result.segment.metadata.source || 'Unknown';
      return `### Source: ${source}\n${result.segment.content}`;
    })
    .join('\n\n---\n\n');
}
