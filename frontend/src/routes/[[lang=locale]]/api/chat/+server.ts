import { type ChatbotAPIInput, ChatEngine, RAGService } from '@openvaa/chatbot';
import { convertUIMessagesToModelMessages } from '$lib/chatbot/adHocMessageConvert';
import { stubDataProvider } from './stubDataProvider';

// API endpoint for chat functionality with RAG enrichment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST({ request, params }: { request: Request; params: any }) {
  const { messages: uiMessages } = await request.json();

  const messages = convertUIMessagesToModelMessages(uiMessages);

  // Initialize RAG service (only happens once, subsequent calls are no-ops)
  await RAGService.initialize();

  // Get the last user query to retrieve RAG context
  let lastUserQuery = '';
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user' && typeof messages[i].content === 'string') {
      lastUserQuery = messages[i].content as string;
      break;
    }
  }

  // Get structured RAG context for the UI
  const ragContextData = lastUserQuery ? await RAGService.searchContextStructured(lastUserQuery, 3) : [];

  // Enhance messages with RAG context from vector store
  const enhancedMessages = await RAGService.enhanceMessagesWithContext(
    messages,
    true, // enableRAG
    3 // topK results
  );

  const input: ChatbotAPIInput = {
    messages: enhancedMessages,
    context: {
      locale: params.lang || 'en'
    },
    getToolsOptions: {
      dataProvider: stubDataProvider
    },
    nSteps: 5
  };

  const result = await ChatEngine.createStream(input);

  // Create custom stream that sends RAG context first, then AI response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        // First, send RAG context as a custom SSE event
        if (ragContextData.length > 0) {
          controller.enqueue(encoder.encode('event: rag-context\n'));
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                query: lastUserQuery,
                results: ragContextData
              })}\n\n`
            )
          );
        }

        // Then pipe the AI SDK stream through
        // We use toUIMessageStreamResponse() and read its body
        const aiResponse = result.toUIMessageStreamResponse();
        const reader = aiResponse.body?.getReader();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        }

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
