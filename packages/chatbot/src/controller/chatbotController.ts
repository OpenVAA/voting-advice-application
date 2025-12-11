import { ChatEngine } from '../core/chat';
import type { RAGRetrievalResult } from '../core/rag/ragService.type';
import type { ChatbotResponse, HandleQueryInput } from './chatbotController.type';

/**
 * Main controller for chatbot query handling
 *
 * Orchestrates the entire pipeline:
 * 1. Streaming response generation (LLM invokes RAG tool when needed)
 *
 * Pure business logic - caller provides infrastructure dependencies (LLM providers, vector store)
 */
export class ChatbotController {
  /**
   * Main entry point for query handling
   *
   * @param input - Query input with messages and infrastructure dependencies
   * @returns Streaming response with metadata
   */
  static async handleQuery(input: HandleQueryInput): Promise<ChatbotResponse> {
    // Create LLM response with unified prompt and tools
    // RAG tool is available for LLM to invoke autonomously when needed
    return this.createLLMResponse({ input });
  }

  /**
   * Create LLM response stream with tools
   *
   * RAG tool is available for LLM to invoke when needed.
   * Metadata about RAG retrieval is captured in the metadataCollector.
   *
   * @param input - Query input
   * @returns Chatbot response with LLM stream and metadata collector
   */
  private static async createLLMResponse({ input }: { input: HandleQueryInput }): Promise<ChatbotResponse> {
    // Create metadata collector for RAG tool results
    const ragMetadataCollector: Array<RAGRetrievalResult> = [];

    const messagesForLLM = [...input.state.messages];
    // Modify the last user message to include the question context if provided

    if (input.state.questionContext) {
      const lastMessage = messagesForLLM[messagesForLLM.length - 1];

      if (lastMessage.role === 'user') {
        const contextString = JSON.stringify(input.state.questionContext, null, 2);
        const messageWithContext =
          '### User Message: ' +
          lastMessage.content +
          '\n\n### User is Looking at this VAA Page. Use this information ONLY if the user asks about it. You can gently ask if they are interested in this topic or something else, if they dont have clear intentions. This is what the user sees in the VAA application while talking to you: ' +
          contextString;

        messagesForLLM[messagesForLLM.length - 1] = {
          ...lastMessage,
          content: messageWithContext
        };
      }}
      
    // Create LLM stream with unified prompt and tools
    const stream = await ChatEngine.createStream({
      messages: input.state.messages,
      ragDependencies: {
        vectorStore: input.vectorStore,
        reformulationProvider: input.reformulationProvider,
        nResultsTarget: input.nResultsTarget,
        rerankConfig: input.rerankConfig,
        metadataCollector: ragMetadataCollector
      },
      context: {
        locale: input.locale
      },
      nSteps: 5,
      chatProvider: input.chatProvider
    });

    // Update state
    const newState = {
      ...input.state,
      messages: input.state.messages
    };

    return {
      stream,
      state: newState,
      metadata: {
        isCannedResponse: false,
        // RAG metadata collector will be populated during tool execution
        ragMetadataCollector,
        // Legacy fields for backward compatibility (can be removed later)
        usedRAG: false,
        ragContext: undefined,
        costs: {
          reranking: undefined
        },
        latency: {
          retrievalMs: 0
        }
      }
    };
  }
}
