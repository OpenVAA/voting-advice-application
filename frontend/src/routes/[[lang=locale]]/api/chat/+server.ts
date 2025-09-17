import { ChatEngine } from '@openvaa/chatbot';
import type { ChatbotAPIInput } from '@openvaa/chatbot';

// API endpoint for chat functionality
export async function POST({ request, params }: { request: Request; params: any }) {
  const { messages } = await request.json();

  const input: ChatbotAPIInput = {
    messages,
    context: {
      locale: params.lang || 'en'
    }
  };

  const result = await ChatEngine.createStream(input);
  return result.toTextStreamResponse();
}
