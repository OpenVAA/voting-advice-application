import type { CostBreakdown } from '@openvaa/core';
import type { LLMProvider, LLMStreamResult } from '@openvaa/llm-refactor';
import type { MultiVectorSearchResult, MultiVectorStore } from '@openvaa/vector-store';
import type { ModelMessage } from 'ai';
import type { QueryCategory } from '../core/queryCategories';

/**
 * Input parameters for ChatbotController.handleQuery()
 *
 * Infrastructure dependencies (LLM providers, vector store) are provided by caller
 * to keep controller pure and testable via dependency injection.
 */
export interface HandleQueryInput {
  /** Conversation history as ModelMessage array */
  messages: Array<ModelMessage>;

  /** User locale for prompts and responses */
  locale: string;

  /** Vector store instance for RAG retrieval */
  vectorStore: MultiVectorStore;

  /** LLM provider for query reformulation */
  queryReformulationProvider: LLMProvider;

  /** Intelligent search flag */
  intelligentSearch: boolean;

  /** LLM provider for result filtering */
  resultFilteringProvider?: LLMProvider;

  /** LLM provider for chat responses (optional - ChatEngine has a default) */
  chatProvider?: LLMProvider;
}

/**
 * Response from ChatbotController.handleQuery()
 *
 * Contains streaming response and metadata about query processing.
 * The controller is transport-agnostic - caller handles HTTP/SSE/WebSocket protocol.
 */
export interface ChatbotResponse {
  /**
   * Streaming text result (unified interface for both canned and LLM responses)
   * Use stream.toUIMessageStreamResponse() for HTTP streaming
   *
   * LLMStreamResult extends Vercel's StreamTextResult with additional metadata:
   * - latencyMs, attempts, costs (Promise), model, fallbackUsed
   */
  stream: LLMStreamResult;

  /**
   * Metadata about query processing
   *
   * Timing notes:
   * - category, reformulatedQuery, ragContext: Available immediately when controller returns
   * - costs.reformulation, costs.filtering: Available immediately when controller returns
   * - LLM costs: Available via await stream.usage and await stream.costs after streaming completes
   * - latency.reformulationMs, latency.retrievalMs: Controller's responsibility
   * - latency.timeToFirstToken, latency.messageTime: API route's responsibility
   */
  metadata: {
    /** Categorization results */
    category: QueryCategory;
    reformulatedQuery: string | null;

    /** Processing decisions */
    isCannedResponse: boolean;
    usedRAG: boolean;

    /** RAG context details (if RAG was used) */
    ragContext?: {
      searchResult: MultiVectorSearchResult;
      segmentsUsed: number;
      formattedContext: string;
    };

    /** Cost tracking */
    costs: {
      /** Costs from query reformulation */
      reformulation: CostBreakdown;
      /** Costs from intelligent result filtering (if used) */
      filtering?: CostBreakdown;
      // Note: LLM generation costs come from stream.usage and stream.costs
    };

    /** Latency tracking (controller's metrics) */
    latency: {
      /** Time spent on query reformulation (ms) */
      reformulationMs: number;
      /** Time spent on RAG retrieval (ms) */
      retrievalMs: number;
      // Note: TTFB and streaming time tracked by API route
    };
  };
}

/**
 * Internal result from query categorization step
 */
export interface CategorizationResult {
  category: QueryCategory;
  rephrased: string | null;
  costs: CostBreakdown;
  durationMs: number;
}

/**
 * Internal result from RAG retrieval step
 */
export interface RAGContextResult {
  searchResult: MultiVectorSearchResult;
  segmentsUsed: number;
  formattedContext: string;
  filteringCosts: CostBreakdown;
  durationMs: number;
}
