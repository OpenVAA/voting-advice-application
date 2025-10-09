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
  return result.toUIMessageStreamResponse();
}
