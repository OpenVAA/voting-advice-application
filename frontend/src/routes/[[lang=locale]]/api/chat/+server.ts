import { ChatbotController, updateConversation } from '@openvaa/chatbot/server';
import { getChatbotConfiguration } from '@openvaa/chatbot/server';
import { convertUIMessagesToModelMessages } from '$lib/chatbot/utils/adHocMessageConvert';
import { COHERE_API_KEY } from './apiKey';
import type { ChatbotResponse, ConversationState } from '@openvaa/chatbot/server';
import type { LLMStreamResult } from '@openvaa/llm-refactor';

// Get chatbot configuration
// TODO: move default config to chatbot package and make optional in its api
const { vectorStore, queryRoutingProvider, queryReformulationProvider, phaseRouterProvider } =
  await getChatbotConfiguration();

// API endpoint for chat functionality with RAG enrichment
// TODO: type the params
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST({ request, params }: { request: Request; params: any }) {
  const requestStartTime = Date.now();

  // Parse request. TODO: store conversation state in redis instead of client
  const { messages: uiMessages, sessionId } = await request.json();
  const messages = convertUIMessagesToModelMessages(uiMessages);
  const locale = params.lang || 'en';

  // Build fresh state for this request
  const state: ConversationState = {
    sessionId: sessionId || crypto.randomUUID(),
    messages,
    phase: 'user_intent_extraction', // Will be determined by phaseRouter
    workingMemory: messages,
    forgottenMessages: [],
    lossyHistorySummary: '',
    locale,
    queryCategory: {
      // Will be determined by categorizeQuery
      category: 'appropriate',
      costs: { input: 0, output: 0, total: 0 },
      durationMs: 0
    },
    reformulatedQuery: null
  };

  // Business logic handled by chatbot package
  const response = await ChatbotController.handleQuery({
    locale,
    state,
    vectorStore: vectorStore,
    queryRoutingProvider: queryRoutingProvider,
    queryReformulationProvider: queryReformulationProvider,
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
    conversationState: state,
    responseState: response.state,
    messages: messages as Array<{ role: string; content: string }>
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
  responseState,
  messages
}: {
  stream: LLMStreamResult;
  metadata: ChatbotResponse['metadata'];
  requestStartTime: number;
  conversationState: ConversationState;
  responseState: ConversationState;
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
        console.info('[Chat API] Logging conversation:', {
          hasUserMessage: !!userMessage,
          hasAssistantResponse: !!assistantResponse,
          sessionId: conversationState.sessionId,
          phase: responseState.phase
        });

        if (userMessage && assistantResponse) {
          // Fire and forget - don't block response on logging
          updateConversation(userMessage, assistantResponse, conversationState.sessionId, responseState.phase).catch(
            (err) => {
              console.error('[Chat API] Failed to log conversation:', err);
            }
          );
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
                phase: responseState.phase,
                category: metadata.categoryResult?.category,
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
