import type { CostBreakdown } from '@openvaa/core';
import type { LLMProvider, LLMStreamResult } from '@openvaa/llm-refactor';
import type { MultiVectorSearchResult, MultiVectorStore, RerankConfig } from '@openvaa/vector-store/types';
import type { ModelMessage } from 'ai';

/** Message moderation and next step decision. Route either to a canned response or generation. */
export type QueryCategory = 'appropriate' | 'inappropriate' | 'not_possible';

/** Query routing result. Contains the categorization and the costs and duration of the routing. */
export type QueryRoutingResult = {
  category: QueryCategory;
  costs: CostBreakdown;
  durationMs: number;
};

export type RAGOptions = {
  nResultsTarget?: number;
  rerankConfig?: RerankConfig;
}

/** Possible phases of the conversation. Used for retrieval gating and guiding the chatbot's behaviour */
export type ConversationPhase = 'intro_to_chatbot_use' | 'user_intent_extraction' | 'intent_resolution';

/** State of the conversation. Updates after each message. This state is required for an intelligent but efficient
 * chatbot. It is used to infer what the chatbot should know and be tasked to do depending on the conversation
 * phase and history.
 */
export interface ConversationState {
  sessionId: string;
  messages: Array<ModelMessage>;
  /** Phase of the conversation. Used for retrieval gating and guiding the chatbot's behaviour */
  phase: ConversationPhase;
  /** Messages that are currently being processed. Messages may be lost due to memory constraints */
  workingMemory: Array<ModelMessage>;
  /** Messages that are lost due to memory constraints */
  forgottenMessages: Array<ModelMessage>;
  /** Summary of the conversation history that is lost due to memory constraints */
  lossyHistorySummary: string;
  locale: string;
  queryCategory: QueryRoutingResult; // TODO: use QueryCategory instead
  reformulatedQuery: string | null;
}

/**
 * Input parameters for ChatbotController.handleQuery()
 *
 * Infrastructure dependencies (LLM providers, vector store) are provided by caller
 * to keep controller pure and testable via dependency injection.
 */
export interface HandleQueryInput {
  /** Conversation state including current phase and working memory */
  state: ConversationState;

  /** User locale for prompts and responses */
  locale: string;

  /** Vector store instance for RAG retrieval */
  vectorStore: MultiVectorStore;

  /** LLM provider for query routing/categorization (lightweight model recommended) */
  queryRoutingProvider: LLMProvider;

  /** LLM provider for conversation phase routing (lightweight model recommended) */
  phaseRouterProvider: LLMProvider;

  /** LLM provider for query reformulation (lightweight model recommended) */
  queryReformulationProvider: LLMProvider;

  /** Optional reranking configuration */
  rerankConfig?: RerankConfig;

  /** Target number of results to retrieve */
  nResultsTarget?: number;

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

  state: ConversationState;

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
    /** Query routing result */
    categoryResult: QueryRoutingResult;
    /** Canonical reformulated query (first query from each topic, joined) */
    reformulatedQuery?: string;
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
      /** Costs from reranking (if used) */
      reranking?: { cost: number };
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
 * Internal result from RAG retrieval step
 */
export interface RAGContextResult {
  searchResult: MultiVectorSearchResult;
  segmentsUsed: number;
  formattedContext: string;
  rerankingCosts?: { cost: number };
  durationMs: number;
}
