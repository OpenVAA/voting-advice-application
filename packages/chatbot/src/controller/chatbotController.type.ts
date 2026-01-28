import type { QuestionType } from '@openvaa/data';
import type { LLMProvider, LLMStreamResult } from '@openvaa/llm';
import type { VectorSearchResult } from '@openvaa/vector-store/types';
import type { ModelMessage } from 'ai';
import type { RAGRetrievalResult } from '../core/rag/ragService.type';
import type { RAGDependencies } from '../core/tools/tools';

export interface ChatbotQuestionContext {
  questionId: string;
  type: QuestionType;
  text: string;
  category?: {
    id: string;
    name: string;
  };
}
/** State of the conversation. Updates after each message. This state is required for an intelligent but efficient
 * chatbot. It is used to infer what the chatbot should know and be tasked to do depending on the conversation
 * history.
 */
export interface ConversationState {
  sessionId: string;
  messages: Array<ModelMessage>;
  locale: string;
  questionContext?: ChatbotQuestionContext;
}

/**
 * Input parameters for ChatbotController.handleQuery()
 *
 * Infrastructure dependencies (LLM providers, vector store) are provided by caller
 * to keep controller pure and testable via dependency injection.
 */
export interface HandleQueryInput extends RAGDependencies {
  /** Conversation state including working memory */
  state: ConversationState;

  /** User locale for prompts and responses */
  locale: string;

  /** LLM provider for chat responses */
  chatProvider: LLMProvider;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stream: LLMStreamResult<any>; // i wouldn't stress this 'any' type too much, complex generic types are hard to type properly

  state: ConversationState;

  /**
   * Metadata about query processing
   *
   * Timing notes:
   * - RAG metadata collector is populated during tool execution
   * - LLM costs: Available via await stream.usage and await stream.costs after streaming completes
   * - latency metrics: API route's responsibility
   */
  metadata: {
    /** Processing decisions */
    isCannedResponse: boolean;

    /** RAG metadata collector - populated during tool execution */
    ragMetadataCollector: Array<RAGRetrievalResult>;

    /** Legacy RAG fields (deprecated - use ragMetadataCollector instead) */
    usedRAG: boolean;
    ragContext?: {
      searchResult: VectorSearchResult;
      segmentsUsed: number;
      formattedContext: string;
    };

    /** Cost tracking */
    costs: {
      /** Costs from reranking (if used) */
      reranking?: { cost: number };
      // Note: LLM generation costs come from stream.usage and stream.costs
    };

    /** Latency tracking (controller's metrics) */
    latency: {
      /** Time spent on RAG retrieval (ms) */
      retrievalMs: number;
      // Note: TTFB and streaming time tracked by API route
    };

    /** Tools used during conversation (populated by API route) */
    toolsUsed?: Array<{ name: string; args: unknown }>;
  };
}

/**
 * Internal result from RAG retrieval step
 */
export interface RAGContextResult {
  searchResult: VectorSearchResult;
  segmentsUsed: number;
  formattedContext: string;
  rerankingCosts?: { cost: number };
  durationMs: number;
}
