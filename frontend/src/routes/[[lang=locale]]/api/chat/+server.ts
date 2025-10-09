import { type ChatbotAPIInput, ChatEngine, RAGService } from '@openvaa/chatbot';
import { convertUIMessagesToModelMessages } from '$lib/chatbot/adHocMessageConvert';
import { stubDataProvider } from './stubDataProvider';
import type { ModelMessage } from 'ai';

// API endpoint for chat functionality with RAG enrichment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST({ request, params }: { request: Request; params: any }) {
  const { messages: uiMessages } = await request.json();

  const messages = convertUIMessagesToModelMessages(uiMessages);

  // Initialize RAG service (only happens once, subsequent calls are no-ops)
  await RAGService.initialize();

  // Get the last message safely
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) {
    throw new Error('No messages provided');
  }

  // Get structured RAG context for the UI
  const ragContextData = await RAGService.searchContextStructured(lastMessage.content, 3);

  // Enhance message with RAG context from vector store
  const enhancedMessage: ModelMessage = await RAGService.enhanceMessageWithContext(
    lastMessage,
    true, // enableRAG
    3 // topK results
  );

  const input: ChatbotAPIInput = {
    messages: [...messages, enhancedMessage],
    context: {
      locale: params.lang || 'en'
    },
    getToolsOptions: {
      dataProvider: stubDataProvider
    },
    nSteps: 5
  };

  const result = await ChatEngine.createStream(input);

  // Create custom stream that sends RAG context first, then AI response, then metadata
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Track timing
      const streamStartTime = performance.now();
      let firstTokenTime = 0;

      try {
        // First, send RAG context as a custom SSE event
        if (ragContextData.length > 0) {
          controller.enqueue(encoder.encode('event: rag-context\n'));
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                query: lastMessage.content,
                results: ragContextData
              })}\n\n`
            )
          );
        }

        // Then pipe the AI SDK stream through while tracking timing
        const aiResponse = result.toUIMessageStreamResponse();
        const reader = aiResponse.body?.getReader();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Track first token time
            if (firstTokenTime === 0) {
              firstTokenTime = performance.now();
            }

            controller.enqueue(value);
          }
        }

        const streamEndTime = performance.now();

        // Calculate timing metrics
        const timeToFirstToken = firstTokenTime > 0 ? firstTokenTime - streamStartTime : 0;
        const totalTime = streamEndTime - streamStartTime;

        // Get cost information
        const costs = await result.costs;

        // Calculate tokens per second (if we have output tokens from usage)
        const usage = await result.usage;
        const tokensPerSecond = usage.outputTokens && totalTime > 0
          ? (usage.outputTokens / (totalTime / 1000))
          : undefined;  

        // Send combined metadata as a single event
        controller.enqueue(encoder.encode('event: metadata-info\n'));
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              cost: {
                input: costs.input,
                output: costs.output,
                reasoning: costs.reasoning,
                total: costs.total
              },
              latency: {
                timeToFirstToken,
                totalTime,
                tokensPerSecond
              },
              timestamp: Date.now()
            })}\n\n`
          )
        );

        controller.close();
      } catch (error) {
        console.error('Error in chat stream:', error);
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
}