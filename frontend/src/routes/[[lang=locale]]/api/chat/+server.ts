import { ChatbotController } from '@openvaa/chatbot/server';
import { getChatbotConfiguration } from '@openvaa/chatbot/server';
import { constants } from '$lib/server/constants';
import { getRedisClient } from '$lib/server/redis/client';
import { RedisConversationStore } from '$lib/server/redis/conversationStore';
import { RateLimiter } from '$lib/server/redis/rateLimiter';
import type { ChatbotQuestionContext, RAGRetrievalResult } from '@openvaa/chatbot';
import type { ConversationState } from '@openvaa/chatbot/server';
import type { LLMStreamResult } from '@openvaa/llm-refactor';

// Get chatbot configuration
// TODO: move default config to chatbot package and make optional in its api
const { vectorStore, queryReformulationProvider, chatProvider } = await getChatbotConfiguration(
  constants.LLM_OPENAI_API_KEY
);

// Initialize Redis store and rate limiter
const conversationStore = new RedisConversationStore(getRedisClient());
const rateLimiter = new RateLimiter(getRedisClient(), 20, 60);

type ChatRequestBody = {
  message: string;
  sessionId?: string;
  questionContext?: ChatbotQuestionContext;
};

// API endpoint for chat functionality with RAG enrichment
export async function POST({ request, params, getClientAddress }) {
  const requestStartTime = Date.now();
  const clientIp = getClientAddress();

  try {
    // Rate limiting check
    const allowed = await rateLimiter.checkLimit(clientIp);
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Try again later.',
          retryAfter: 60
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      );
    }

    // Parse request - client sends single message with optional sessionId and questionContext
    const { message, sessionId: clientSessionId, questionContext } = (await request.json()) as ChatRequestBody;
    const locale = params.lang || 'en';

    // Load or create session
    let sessionId: string;
    let state: ConversationState;

    if (clientSessionId) {
      // Try to load existing session
      const existingState = await conversationStore.get(clientSessionId);
      if (existingState) {
        sessionId = clientSessionId;
        state = existingState;
      } else {
        // Invalid sessionId - create new session
        console.warn(`[Chat API] Invalid sessionId ${clientSessionId}, creating new session`);
        sessionId = crypto.randomUUID();
        state = createNewState(sessionId, locale);
      }
    } else {
      // New conversation
      sessionId = crypto.randomUUID();
      state = createNewState(sessionId, locale);
    }

    // Append new user message to state
    state.messages.push({ role: 'user', content: message });
    state.questionContext = questionContext;

    // Business logic handled by chatbot package
    const response = await ChatbotController.handleQuery({
      locale,
      state,
      vectorStore: vectorStore,
      reformulationProvider: queryReformulationProvider,
      chatProvider,
      rerankConfig: {
        enabled: true,
        apiKey: constants.COHERE_API_KEY as string,
        model: 'rerank-v3.5'
      },
      nResultsTarget: 5
    });

    // Save updated state to Redis
    console.info('Conversation state: ' + JSON.stringify(response.state));
    await conversationStore.set(sessionId, response.state);

    // Wrap in SSE stream with RAG metadata collector
    return wrapInSSE({
      sessionId,
      stream: response.stream,
      ragMetadataCollector: response.metadata.ragMetadataCollector,
      requestStartTime,
      conversationState: response.state,
      conversationStore
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return new Response(JSON.stringify({ error: 'Chat service unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function createNewState(sessionId: string, locale: string): ConversationState {
  return {
    sessionId,
    messages: [],
    locale
  };
}

/**
 * Wrap ChatbotResponse in Server-Sent Events format
 * Pure HTTP/SSE protocol handling
 */
async function wrapInSSE({
  sessionId,
  stream,
  ragMetadataCollector,
  requestStartTime,
  conversationState,
  conversationStore
}: {
  sessionId: string;
  stream: LLMStreamResult;
  ragMetadataCollector: Array<RAGRetrievalResult>;
  requestStartTime: number;
  conversationState: ConversationState;
  conversationStore: RedisConversationStore;
}) {
  const sseStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const streamStartTime = performance.now();
      let firstTokenTime = 0;

      try {
        // Send sessionId immediately so client can store it
        controller.enqueue(encoder.encode('event: session-id\n'));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ sessionId })}\n\n`));

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

        // Append assistant message to conversation state and save to Redis
        conversationState.messages.push({ role: 'assistant', content: assistantResponse });
        await conversationStore.set(sessionId, conversationState);

        // Compute timing metrics (API route's responsibility)
        const timeToFirstToken = firstTokenTime > 0 ? firstTokenTime - streamStartTime : 0;
        const messageTime = streamEndTime - streamStartTime;
        const totalTime = Date.now() - requestStartTime;

        // Get LLM costs and usage from stream
        const costs = await stream.costs;
        const usage = await stream.usage;
        const tokensPerSecond =
          usage.outputTokens && messageTime > 0 ? usage.outputTokens / (messageTime / 1000) : undefined;

        // Get all steps from stream (available after stream completes)
        // Each step contains tool calls and tool results from that step
        const steps = await stream.steps;
        console.info('[Chat API] Number of steps:', steps.length);

        // Collect all tool results from all steps
        const allToolResults = steps.flatMap((step) => step.toolResults);
        console.info('[Chat API] All tool results from all steps:', allToolResults);

        // Extract tool calls for display (collect from all steps)
        const toolsUsed = allToolResults.map((tr) => ({
          name: tr.toolName,
          args: tr.input
        }));
        console.info('[Chat API] Formatted toolsUsed:', toolsUsed);

        // Extract RAG metadata from collector
        // The collector was populated during tool execution with full RAGRetrievalResult objects
        let ragContexts = null;
        let rerankingCost = 0;
        let retrievalDuration = 0;
        let totalSegments = 0;

        // Get all RAG results from the collector
        if (ragMetadataCollector.length > 0) {
          // Extract metadata (sum costs and durations across all searches)
          rerankingCost = ragMetadataCollector.reduce((sum, r) => sum + (r.rerankingCosts?.cost || 0), 0);
          retrievalDuration = ragMetadataCollector.reduce((sum, r) => sum + (r.durationMs || 0), 0);
          totalSegments = ragMetadataCollector.reduce((sum, r) => sum + (r.segmentsUsed || 0), 0);

          // Prepare RAG contexts for frontend (send all RAGRetrievalResults)
          ragContexts = ragMetadataCollector;
        }

        // Send RAG contexts if available (after streaming completes)
        if (ragContexts) {
          controller.enqueue(encoder.encode('event: rag-contexts\n'));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ contexts: ragContexts })}\n\n`));
        }

        // Send combined metadata (after streaming completes)
        controller.enqueue(encoder.encode('event: metadata-info\n'));
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              cost: {
                llm: costs,
                filtering: { input: 0, output: 0, total: 0 },
                reranking: { cost: rerankingCost },
                total: costs.total + rerankingCost
              },
              latency: {
                retrievalDuration,
                timeToFirstToken,
                messageTime,
                totalTime,
                tokensPerSecond
              },
              rag: {
                needsRAG: !!ragContexts,
                segmentsRetrieved: totalSegments,
                toolsUsed
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
