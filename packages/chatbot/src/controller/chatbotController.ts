import { setPromptVars } from '@openvaa/llm-refactor';
import { getCannedResponse } from '../core/cannedResponses';
import { ChatEngine } from '../core/chat';
import { CHATBOT_SKILLS, FALLBACK_TOPICS, OUT_OF_SCOPE_TOPICS } from '../defaultConfig/chatbotSkills';
import { determineConversationPhase } from '../utils/phaseRouter';
import { loadPrompt } from '../utils/promptLoader';
import { reformulateQuery } from '../utils/queryReformulator';
import { routeQuery } from '../utils/queryRouter';
import type { MultiVectorSearchResult } from '@openvaa/vector-store/types';
import type { ModelMessage } from 'ai';
import type { LoadedPrompt } from '../types/prompt.type';
import type {
  ChatbotResponse,
  ConversationPhase,
  ConversationState,
  HandleQueryInput,
  QueryCategory,
  QueryRoutingResult,
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
    const [routingResult, phase] = await Promise.all([
      this.categorizeQuery(input),
      determineConversationPhase(input.state, input.phaseRouterProvider)
    ]);

    // PHASE 3: Decision - should we return canned response?
    if (this.shouldReturnCanned(routingResult.category)) {
      return this.createCannedResponse({ routingResult, state: input.state });
    }

    // PHASE 4: RAG if necessary (uses conversation phase)
    const isRagRequired = phase === 'intent_resolution'; // TODO: use something more sophisticated? like
    let ragContext: RAGContextResult | null = null;
    let canonicalQuery: string | null = null;

    if (isRagRequired) {
      // Reformulate query into topics with k diverse reformulations per topic
      const reformulations = await reformulateQuery(
        input.state,
        input.queryReformulationProvider,
        3 // k = 3 reformulations per topic
      );

      // Extract canonical queries (first query from each topic)
      canonicalQuery = Object.values(reformulations)
        .map((queries) => queries[0])
        .filter(Boolean)
        .join('. ');

      ragContext = await this.retrieveRAG({
        queries: reformulations,
        input
      });
    } else {
      ragContext = null;
    }

    // PHASE 5: Create LLM response with phase-specific prompt
    return this.createLLMResponse({
      routingResult,
      ragContext,
      input,
      newPhase: phase,
      canonicalQuery
    });
  }

  /**
   * Route user query
   *
   * @param input - Query input
   * @returns Query routing result with costs and timing
   */
  private static async categorizeQuery(input: HandleQueryInput): Promise<QueryRoutingResult> {
    const startTime = Date.now();
    const costsBefore = input.queryRoutingProvider.cumulativeCosts;

    // Get full conversation messages (user + assistant)
    const msgs = Array.isArray(input.state?.messages) ? input.state.messages : [];

    // Route query: is it appropriate, inappropriate, or not possible to answer?
    const routingResult = await routeQuery({
      messages: msgs,
      provider: input.queryRoutingProvider,
      chatbotSkills: CHATBOT_SKILLS,
      fallbackTopics: FALLBACK_TOPICS,
      outOfScopeTopics: OUT_OF_SCOPE_TOPICS
    });

    const costsAfter = input.queryRoutingProvider.cumulativeCosts;
    const durationMs = Date.now() - startTime;

    return {
      category: routingResult.category as QueryCategory,
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
    return category !== 'appropriate'; 
  }

  /**
   * Retrieve RAG context for reformulated queries
   *
   * @param queries - Map of topics to reformulated query arrays
   * @param input - Query input
   * @returns RAG context
   */
  private static async retrieveRAG({
    queries,
    input
  }: {
    queries: Record<string, Array<string>>;
    input: HandleQueryInput;
  }): Promise<RAGContextResult> {
    const startTime = Date.now();

    // Perform vector search with reformulated queries
    const searchResult = await input.vectorStore.search({
      queries,
      nResultsTarget: input.nResultsTarget || 10,
      searchCollections: ['segment', 'summary', 'fact'],
      searchConfig: {}, // Use defaults from multiVectorStore
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
   * @param routingResult - Query routing result
   * @returns Chatbot response with canned stream
   */
  private static async createCannedResponse({
    routingResult,
    state
  }: {
    routingResult: QueryRoutingResult;
    state: ConversationState;
  }): Promise<ChatbotResponse> {
    const message = getCannedResponse(routingResult.category);
    if (!message) {
      throw new Error(`No canned response defined for route: ${routingResult.category}`);
    }

    // Create streaming wrapper for canned message
    const stream = await ChatEngine.createCannedStream(message);

    const newState = {
      ...state,
      messages: [...state.messages, { role: 'assistant', content: message } as ModelMessage],
      queryCategory: routingResult,
      reformulatedQuery: null // No reformulation for canned responses
    };

    return {
      stream,
      state: newState,
      metadata: {
        categoryResult: routingResult,
        reformulatedQuery: undefined,
        isCannedResponse: true,
        usedRAG: false,
        costs: {
          reformulation: routingResult.costs
        },
        latency: {
          reformulationMs: routingResult.durationMs,
          retrievalMs: 0
        }
      }
    };
  }

  /**
   * Create LLM response stream with optional RAG context
   *
   * @param routingResult - Query routing result
   * @param ragContext - RAG context (if retrieved)
   * @param input - Query input
   * @param newPhase - New conversation phase
   * @param canonicalQuery - Canonical reformulated query (first query from each topic)
   * @returns Chatbot response with LLM stream
   */
  private static async createLLMResponse({
    routingResult,
    ragContext,
    input,
    newPhase,
    canonicalQuery
  }: {
    routingResult: QueryRoutingResult;
    ragContext: RAGContextResult | null;
    input: HandleQueryInput;
    newPhase: ConversationPhase;
    canonicalQuery: string | null;
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
      phase: newPhase,
      queryCategory: routingResult,
      reformulatedQuery: canonicalQuery
    };

    return {
      stream,
      state: newState,
      metadata: {
        categoryResult: routingResult,
        reformulatedQuery: canonicalQuery || undefined,
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
          reformulation: routingResult.costs,
          reranking: ragContext?.rerankingCosts
        },
        latency: {
          reformulationMs: routingResult.durationMs,
          retrievalMs: ragContext?.durationMs || 0
        }
      }
    };
  }
}
