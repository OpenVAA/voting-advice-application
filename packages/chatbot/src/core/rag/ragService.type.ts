import type { VectorSearchResult, VectorStore } from '@openvaa/vector-store/types';
import type { RerankConfig } from '@openvaa/vector-store/types';
/**
 * Input parameters for RAG retrieval
 */
export interface RAGRetrievalInput {
  /** Simple user query string */
  query: string;

  /** Vector store instance for retrieval */
  vectorStore: VectorStore;

  /** Target number of results to retrieve */
  nResultsTarget?: number;

  /** Optional reranking configuration */
  rerankConfig?: RerankConfig;
}

/**
 * Result from RAG retrieval operation
 */
export interface RAGRetrievalResult {
  /** Vector search results */
  searchResult: VectorSearchResult;

  /** Number of segments used in context */
  segmentsUsed: number;

  /** Formatted context string ready for LLM injection */
  formattedContext: string;

  /** UNUSED: Reformulated queries used for retrieval. TODO: implement query reformulation. */
  reformulatedQueries: Record<string, Array<string>>;

  /** UNUSED: Canonical query (if there is query reformulation). TODO: implement query reformulation. */
  canonicalQuery: string;

  /** Reranking costs if reranking was used */
  rerankingCosts?: { cost: number };

  /** Duration of RAG operation in milliseconds */
  durationMs: number;
}

/**
 * Mutable collector for capturing RAG metadata when tool is invoked
 * Controller provides this to capture results as side effect
 */
export interface RAGMetadataCollector {
  /** Captured result from RAG tool invocation (undefined until tool is called) */
  result?: RAGRetrievalResult;
}
