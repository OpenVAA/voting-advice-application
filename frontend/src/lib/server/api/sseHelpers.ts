/**
 * Helper functions for SSE (Server-Sent Events) stream handling in API routes
 */

import type { RAGRetrievalResult } from '@openvaa/chatbot';
import type { ConversationState } from '@openvaa/chatbot/server';
import type { LLMStreamResult } from '@openvaa/llm-refactor';
import type { RedisConversationStore } from '$lib/server/redis/conversationStore';

/**
 * Send an SSE event
 */
function sendSSEEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  eventName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): void {
  controller.enqueue(encoder.encode(`event: ${eventName}\n`));
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

/**
 * Calculate RAG metadata from collector
 */
function calculateRAGMetadata(ragMetadataCollector: Array<RAGRetrievalResult>) {
  if (ragMetadataCollector.length === 0) {
    return {
      ragContexts: null,
      rerankingCost: 0,
      retrievalDuration: 0,
      totalSegments: 0
    };
  }

  const rerankingCost = ragMetadataCollector.reduce((sum, r) => sum + (r.rerankingCosts?.cost || 0), 0);
  const retrievalDuration = ragMetadataCollector.reduce((sum, r) => sum + (r.durationMs || 0), 0);
  const totalSegments = ragMetadataCollector.reduce((sum, r) => sum + (r.segmentsUsed || 0), 0);

  return {
    ragContexts: ragMetadataCollector,
    rerankingCost,
    retrievalDuration,
    totalSegments
  };
}

/**
 * Extract tool usage information from stream steps
 */
async function extractToolUsage(stream: LLMStreamResult) {
  const steps = await stream.steps;
  console.info('[Chat API] Number of steps:', steps.length);

  const allToolResults = steps.flatMap((step) => step.toolResults);
  console.info('[Chat API] All tool results from all steps:', allToolResults);

  const toolsUsed = allToolResults.map((tr) => ({
    name: tr.toolName,
    args: tr.input
  }));
  console.info('[Chat API] Formatted toolsUsed:', toolsUsed);

  return toolsUsed;
}

/**
 * Calculate timing metrics
 */
function calculateTimingMetrics(
  streamStartTime: number,
  streamEndTime: number,
  firstTokenTime: number,
  requestStartTime: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  usage: any,
  messageTime: number
) {
  const timeToFirstToken = firstTokenTime > 0 ? firstTokenTime - streamStartTime : 0;
  const tokensPerSecond = usage.outputTokens && messageTime > 0 ? usage.outputTokens / (messageTime / 1000) : undefined;
  const totalTime = Date.now() - requestStartTime;

  return {
    timeToFirstToken,
    messageTime,
    totalTime,
    tokensPerSecond
  };
}

/**
 * Wrap ChatbotResponse in Server-Sent Events format
 * Pure HTTP/SSE protocol handling
 */
export async function wrapInSSE({
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
        sendSSEEvent(controller, encoder, 'session-id', { sessionId });

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
        const messageTime = streamEndTime - streamStartTime;

        // Get full assistant response from AI SDK stream
        const assistantResponse = await stream.text;

        // Append assistant message to conversation state and save to Redis
        conversationState.messages.push({ role: 'assistant', content: assistantResponse });
        await conversationStore.set(sessionId, conversationState);

        // Get LLM costs and usage from stream
        const costs = await stream.costs;
        const usage = await stream.usage;

        // Extract tool usage information
        const toolsUsed = await extractToolUsage(stream);

        // Calculate RAG metadata
        const { ragContexts, rerankingCost, retrievalDuration, totalSegments } =
          calculateRAGMetadata(ragMetadataCollector);

        // Send RAG contexts if available (after streaming completes)
        if (ragContexts) {
          sendSSEEvent(controller, encoder, 'rag-contexts', { contexts: ragContexts });
        }

        // Calculate timing metrics
        const timingMetrics = calculateTimingMetrics(
          streamStartTime,
          streamEndTime,
          firstTokenTime,
          requestStartTime,
          usage,
          messageTime
        );

        // Send combined metadata (after streaming completes)
        sendSSEEvent(controller, encoder, 'metadata-info', {
          cost: {
            llm: costs,
            filtering: { input: 0, output: 0, total: 0 },
            reranking: { cost: rerankingCost },
            total: costs.total + rerankingCost
          },
          latency: {
            retrievalDuration,
            ...timingMetrics
          },
          rag: {
            needsRAG: !!ragContexts,
            segmentsRetrieved: totalSegments,
            toolsUsed
          },
          timestamp: Date.now()
        });

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
