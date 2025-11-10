import { setPromptVars } from '@openvaa/llm-refactor';
import { routeQuery } from '@openvaa/vector-store/utils';
import { getCannedResponse } from '../core/cannedResponses';
import { ChatEngine } from '../core/chat';
import { ALL_CATEGORY_VALUES, isQueryable, needsCannedResponse } from '../core/queryCategories';
import { determineConversationPhase } from '../utils/phaseRouter';
import { loadPrompt } from '../utils/promptLoader';
import type { MultiVectorSearchResult } from '@openvaa/vector-store/types';
import type { ModelMessage } from 'ai';
import type { QueryCategory } from '../core/queryCategories';
import type { LoadedPrompt } from '../types/prompt.type';
import type {
  CategorizationResult,
  ChatbotResponse,
  ConversationPhase,
  ConversationState,
  HandleQueryInput,
  RAGContextResult
} from './chatbotController.type';

/**
 * Main controller for chatbot query handling
 *
 * Orchestrates the entire pipeline:
 * 1. Query categorization and reformulation
 * 2. Decision: canned response vs RAG vs LLM-only
 * 3. RAG retrieval (if needed)
 * 4. Message enhancement with context
 * 5. Streaming response generation
 *
 * Pure business logic - caller provides infrastructure dependencies (LLM providers, vector store)
 */
export class ChatbotController {
  private static userQueryPrompt: LoadedPrompt | null = null;

  /**
   * Main entry point for query handling
   *
   * @param input - Query input with messages and infrastructure dependencies
   * @returns Streaming response with metadata
   */
  static async handleQuery(input: HandleQueryInput): Promise<ChatbotResponse> {
    // PHASE 1 & 2: Run categorization and phase determination in parallel
    const [categorization, newPhase] = await Promise.all([
      this.categorizeQuery(input),
     determineConversationPhase(input.state, input.phaseRouterProvider)
    ]);

    // PHASE 3: Decision - should we return canned response?
    if (this.shouldReturnCanned(categorization.category)) {
      return this.createCannedResponse({ categorization, state: input.state });
    }

    // PHASE 4: Check if RAG required → retrieve if yes
    const ragContext = this.isRagRequired(newPhase, categorization.category)
      ? await this.retrieveRAG({ categorization, input })
      : null;

    // PHASE 5: Create LLM response with phase-specific prompt
    return this.createLLMResponse({ categorization, ragContext, input, newPhase });
  }

  /**
   * Categorize user query and reformulate for search if needed
   *
   * @param input - Query input
   * @returns Categorization result with costs and timing
   */
  private static async categorizeQuery(input: HandleQueryInput): Promise<CategorizationResult> {
    const startTime = Date.now();
    const costsBefore = input.queryRoutingProvider.cumulativeCosts;

    // Extract user messages for context
    const userMessages = input.state.messages.filter((msg) => msg.role === 'user').map((msg) => msg.content as string);

    // Route and reformulate query
    const { category, rephrased } = await routeQuery({
      messages: userMessages,
      provider: input.queryRoutingProvider,
      categories: ALL_CATEGORY_VALUES
    });

    const costsAfter = input.queryRoutingProvider.cumulativeCosts;
    const durationMs = Date.now() - startTime;

    return {
      category: category as QueryCategory,
      rephrased,
      costs: {
        total: costsAfter - costsBefore,
        input: 0, // Would need detailed tracking
        output: 0
      },
      durationMs
    };
  }

  /**
   * Check if category requires canned response
   *
   * @param category - Query category
   * @returns True if canned response should be returned
   */
  private static shouldReturnCanned(category: QueryCategory): boolean {
    return needsCannedResponse(category);
  }

  /**
   * Check if RAG retrieval is required
   * RAG only enabled in intent_resolution phase for queryable categories
   *
   * @param phase - Current conversation phase
   * @param category - Query category
   * @returns True if RAG should be retrieved
   */
  private static isRagRequired(phase: ConversationPhase, category: QueryCategory): boolean {
    return phase === 'intent_resolution' && isQueryable(category);
  }

  /**
   * Retrieve RAG context for query
   * NOTE: Caller must check isRagRequired() before calling
   *
   * @param categorization - Categorization result
   * @param input - Query input
   * @returns RAG context
   */
  private static async retrieveRAG({
    categorization,
    input
  }: {
    categorization: CategorizationResult,
    input: HandleQueryInput
  }): Promise<RAGContextResult> {
    if (!categorization.rephrased) {
      throw new Error('Cannot retrieve RAG without reformulated query');
    }

    const startTime = Date.now();

    // Perform vector search
    const searchResult = await input.vectorStore.search({
      query: categorization.rephrased,
      nResultsTarget: input.nResultsTarget || 10,
      searchCollections: ['segment', 'summary', 'fact'],
      searchConfig: {}, // Use defaults: facts (topK:10, min:0.5), others (topK:8, min:0.3)
      rerankConfig: input.rerankConfig
    });

    const durationMs = Date.now() - startTime;

    return {
      searchResult,
      segmentsUsed: searchResult.results.length,
      formattedContext: this.formatRAGContext(searchResult),
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
  private static formatRAGContext(searchResult: MultiVectorSearchResult): string {
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

  /**
   * Enhance messages with RAG context using prompt template
   *
   * @param messages - Original conversation messages
   * @param ragContext - Formatted RAG context string
   * @returns Enhanced messages with context injected
   */
  private static async enhanceMessagesWithRAG(
    messages: Array<ModelMessage>,
    ragContext: string
  ): Promise<Array<ModelMessage>> {
    // Load prompt template (singleton)
    if (!this.userQueryPrompt) {
      this.userQueryPrompt = await loadPrompt({ promptFileName: 'userQueryWithContext' });
    }

    const lastMessage = messages[messages.length - 1];

    // Fill template with context and query
    const enhancedContent = setPromptVars({
      promptText: this.userQueryPrompt.prompt,
      variables: {
        context: ragContext,
        query: lastMessage.content
      },
      strict: true
    });

    const enhancedMessage: ModelMessage = {
      role: 'user',
      content: enhancedContent
    };

    return [...messages.slice(0, -1), enhancedMessage];
  }

  /**
   * Create canned response stream
   *
   * @param categorization - Categorization result
   * @returns Chatbot response with canned stream
   */
  private static async createCannedResponse({
    categorization,
    state
  }: {
    categorization: CategorizationResult;
    state: ConversationState;
  }): Promise<ChatbotResponse> {
    const message = getCannedResponse(categorization.category);
    if (!message) {
      throw new Error(`No canned response defined for category: ${categorization.category}`);
    }

    // Create streaming wrapper for canned message
    const stream = await ChatEngine.createCannedStream(message);

    const newState = {
      ...state,
      messages: [...state.messages, { role: 'assistant', content: message } as ModelMessage]
    };

    return {
      stream,
      state: newState,
      metadata: {
        categoryResult: categorization,
        isCannedResponse: true,
        usedRAG: false,
        costs: {
          reformulation: categorization.costs
        },
        latency: {
          reformulationMs: categorization.durationMs,
          retrievalMs: 0
        }
      }
    };
  }

  /**
   * Create LLM response stream with optional RAG context
   *
   * @param categorization - Categorization result
   * @param ragContext - RAG context (if retrieved)
   * @param input - Query input
   * @param newPhase - New conversation phase
   * @returns Chatbot response with LLM stream
   */
  private static async createLLMResponse({
    categorization,
    ragContext,
    input,
    newPhase
  }: {
    categorization: CategorizationResult,
    ragContext: RAGContextResult | null,
    input: HandleQueryInput,
    newPhase: ConversationPhase
  }): Promise<ChatbotResponse> {
    // Enhance messages with RAG context if available
    const messages = ragContext
      ? await this.enhanceMessagesWithRAG(input.state.messages, ragContext.formattedContext)
      : input.state.messages;

    // Create LLM stream with phase-specific prompt
    const stream = await ChatEngine.createStream({
      messages,
      context: {
        locale: input.locale
      },
      nSteps: 5,
      llmProvider: input.chatProvider,
      conversationPhase: newPhase
    });

    // Update state
    const newState = {
      ...input.state,
      messages,
      phase: newPhase
    };

    return {
      stream,
      state: newState,
      metadata: {
        categoryResult: categorization,
        isCannedResponse: false,
        usedRAG: !!ragContext,
        ragContext: ragContext
          ? {
              searchResult: ragContext.searchResult,
              segmentsUsed: ragContext.segmentsUsed,
              formattedContext: ragContext.formattedContext
            }
          : undefined,
        costs: {
          reformulation: categorization.costs,
          reranking: ragContext?.rerankingCosts
        },
        latency: {
          reformulationMs: categorization.durationMs,
          retrievalMs: ragContext?.durationMs || 0
        }
      }
    };
  }
}
