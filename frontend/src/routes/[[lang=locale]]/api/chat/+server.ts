import { ChatbotController, getChatbotConfiguration, updateConversation } from '@openvaa/chatbot';
import { convertUIMessagesToModelMessages } from '$lib/chatbot/utils/adHocMessageConvert';
import { COHERE_API_KEY } from './apiKey';
import type { ConversationState } from '@openvaa/chatbot';

// Initialize chatbot configuration (singleton pattern)
const config = getChatbotConfiguration();
const multiVectorStore = await config.vectorStore;
const queryReformulationProvider = config.queryRoutingProvider;
const phaseRouterProvider = config.phaseRouterProvider;

// API endpoint for chat functionality with RAG enrichment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST({ request, params }: { request: Request; params: any }) {
  const requestStartTime = Date.now();

  // Parse request
  const { messages: uiMessages, conversationState: clientConversationState } = await request.json();
  const messages = convertUIMessagesToModelMessages(uiMessages);
  const locale = params.lang || 'en';

  // Initialize conversation state if not provided
  const conversationState: ConversationState = clientConversationState || {
    sessionId: crypto.randomUUID(),
    phase: 'intro_to_chatbot_use',
    workingMemory: messages,
    forgottenMessages: [], // TODO: Implement forgotten messages
    lossyHistorySummary: '', // TODO: Implement lossy history summary
    locale
  };

  // Call controller (all business logic orchestrated here)
  const response = await ChatbotController.handleQuery({
    messages,
    locale,
    conversationState,
    vectorStore: multiVectorStore,
    queryRoutingProvider: queryReformulationProvider,
    phaseRouterProvider: phaseRouterProvider,
    rerankConfig: {
      enabled: true,
      apiKey: COHERE_API_KEY,
      model: 'rerank-v3.5'
    },
    nResultsTarget: 5
    // chatProvider omitted - ChatEngine will use its default
  });

  // Wrap in SSE stream with metadata
  return wrapInSSE({
    stream: response.stream,
    metadata: response.metadata,
    requestStartTime,
    conversationState,
    messages
  });
}

/**
 * Wrap ChatbotResponse in Server-Sent Events format
 * Pure HTTP/SSE protocol handling
 */
async function wrapInSSE({
  stream,
  metadata,
  requestStartTime,
  conversationState,
  messages
}: {
  stream: any;
  metadata: any;
  requestStartTime: number;
  conversationState: ConversationState;
  messages: Array<{ role: string; content: string }>;
}) {
  const sseStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const streamStartTime = performance.now();
      let firstTokenTime = 0;

      try {
        // Send RAG context if available (before streaming starts)
        if (metadata.ragContext) {
          controller.enqueue(encoder.encode('event: rag-context\n'));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata.ragContext.searchResult)}\n\n`));
        }

        // Pipe AI SDK stream
        const aiResponse = stream.toUIMessageStreamResponse();
        const reader = aiResponse.body?.getReader();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (firstTokenTime === 0) {
              firstTokenTime = performance.now();
            }

            controller.enqueue(value);
          }
        }

        const streamEndTime = performance.now();

        // Get full assistant response from AI SDK stream
        const assistantResponse = await stream.text;

        // Log conversation exchange
        const userMessage = messages.findLast((msg) => msg.role === 'user')?.content || '';
        console.log('[Chat API] Logging conversation:', {
          hasUserMessage: !!userMessage,
          hasAssistantResponse: !!assistantResponse,
          sessionId: conversationState.sessionId,
          phase: conversationState.phase
        });

        if (userMessage && assistantResponse) {
          // Fire and forget - don't block response on logging
          updateConversation(
            userMessage,
            assistantResponse,
            conversationState.sessionId,
            conversationState.phase
          ).catch((err) => {
            console.error('[Chat API] Failed to log conversation:', err);
          });
        } else {
          console.warn('[Chat API] Skipping conversation log - missing user or assistant message');
        }

        // Compute timing metrics (API route's responsibility)
        const timeToFirstToken = firstTokenTime > 0 ? firstTokenTime - streamStartTime : 0;
        const messageTime = streamEndTime - streamStartTime;
        const totalTime = Date.now() - requestStartTime;

        // Get LLM costs and usage from stream
        const costs = await stream.costs;
        const usage = await stream.usage;
        const tokensPerSecond =
          usage.outputTokens && messageTime > 0 ? usage.outputTokens / (messageTime / 1000) : undefined;

        // Send combined metadata (after streaming completes)
        controller.enqueue(encoder.encode('event: metadata-info\n'));
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              cost: {
                llm: costs,
                reformulation: metadata.costs.reformulation,
                filtering: { input: 0, output: 0, total: 0 },
                reranking: metadata.costs.reranking || { cost: 0 },
                total: costs.total + metadata.costs.reformulation.total + (metadata.costs.reranking?.cost || 0)
              },
              latency: {
                reformulationDuration: metadata.latency.reformulationMs,
                retrievalDuration: metadata.latency.retrievalMs,
                timeToFirstToken,
                messageTime,
                totalTime,
                tokensPerSecond
              },
              rag: {
                category: metadata.category,
                reformulatedQuery: metadata.reformulatedQuery,
                needsRAG: metadata.usedRAG,
                segmentsRetrieved: metadata.ragContext?.segmentsUsed ?? 0
              },
              timestamp: Date.now()
            })}\n\n`
          )
        );

        controller.close();
      } catch (error) {
        console.error('Error in SSE stream:', error);
        controller.error(error);
      }
    }
  });

  return new Response(sseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
}
