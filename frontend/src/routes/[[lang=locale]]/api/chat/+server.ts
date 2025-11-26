import { ChatbotController, updateConversation } from '@openvaa/chatbot/server';
import { getChatbotConfiguration } from '@openvaa/chatbot/server';
import { convertUIMessagesToModelMessages } from '$lib/chatbot/utils/adHocMessageConvert';
import { constants } from '$lib/server/constants';
import type { RAGRetrievalResult } from '@openvaa/chatbot';
import type { ConversationState } from '@openvaa/chatbot/server';
import type { LLMStreamResult } from '@openvaa/llm-refactor';

// Get chatbot configuration
// TODO: move default config to chatbot package and make optional in its api
const { vectorStore, queryReformulationProvider, chatProvider } = await getChatbotConfiguration(
  constants.LLM_OPENAI_API_KEY
);

// API endpoint for chat functionality with RAG enrichment
// TODO: type the params
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST({ request, params }: { request: Request; params: any }) {
  const requestStartTime = Date.now();

  // Parse request. TODO: store conversation state in redis instead of client
  const { messages: uiMessages, sessionId } = await request.json();
  const messages = convertUIMessagesToModelMessages(uiMessages);
  const locale = params.lang || 'en';

  // TODO: fix state management.
  // Build fresh state for this request
  const state: ConversationState = {
    sessionId: sessionId || crypto.randomUUID(),
    messages,
    workingMemory: messages,
    forgottenMessages: [],
    lossyHistorySummary: '',
    locale
  };

  // Business logic handled by chatbot package
  const response = await ChatbotController.handleQuery({
    locale,
    state,
    vectorStore: vectorStore,
    reformulationProvider: queryReformulationProvider,
    chatProvider,
    rerankConfig: {
      enabled: true,
      apiKey: constants.COHERE_API_KEY as string, // TODO: check if it exists!
      model: 'rerank-v3.5'
    },
    nResultsTarget: 5
  });

  // Wrap in SSE stream with RAG metadata collector
  return wrapInSSE({
    stream: response.stream,
    ragMetadataCollector: response.metadata.ragMetadataCollector,
    requestStartTime,
    conversationState: state,
    messages: messages as Array<{ role: string; content: string }>
  });
}

/**
 * Wrap ChatbotResponse in Server-Sent Events format
 * Pure HTTP/SSE protocol handling
 */
async function wrapInSSE({
  stream,
  ragMetadataCollector,
  requestStartTime,
  conversationState,
  messages
}: {
  stream: LLMStreamResult;
  ragMetadataCollector: Array<RAGRetrievalResult>;
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
        if (userMessage && assistantResponse) {
          // Fire and forget - don't block response on logging
          updateConversation(userMessage, assistantResponse, conversationState.sessionId).catch((err) => {
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

        // Get all RAG results from the collector (now an array)
        if (ragMetadataCollector.length > 0) {
          console.info('[Chat API] Found RAG metadata from collector:', {
            numberOfSearches: ragMetadataCollector.length,
            searches: ragMetadataCollector.map((r, i) => ({
              index: i,
              segmentsUsed: r.segmentsUsed,
              resultsCount: r.searchResult?.results?.length
            }))
          });

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
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(ragContexts)}\n\n`));
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
