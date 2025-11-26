import type { LLMProvider } from '@openvaa/llm-refactor';
import type { MultiVectorSearchResult, MultiVectorStore, RerankConfig } from '@openvaa/vector-store/types';

/**
 * Input parameters for RAG retrieval
 */
export interface RAGRetrievalInput {
  /** Simple user query string */
  query: string;

  /** Vector store instance for retrieval */
  vectorStore: MultiVectorStore;

  /** LLM provider for query reformulation */
  reformulationProvider: LLMProvider;

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
  searchResult: MultiVectorSearchResult;

  /** Number of segments used in context */
  segmentsUsed: number;

  /** Formatted context string ready for LLM injection */
  formattedContext: string;

  /** Reformulated queries used for retrieval */
  reformulatedQueries: Record<string, Array<string>>;

  /** Canonical query (first query from each topic, joined) */
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
