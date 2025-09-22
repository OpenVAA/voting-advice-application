import { type ChatbotAPIInput, ChatEngine } from '@openvaa/chatbot';
import { stubDataProvider } from './stubDataProvider';

// API endpoint for chat functionality
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST({ request, params }: { request: Request; params: any }) {
  const { messages } = await request.json();

  const input: ChatbotAPIInput = {
    messages,
    context: {
      locale: params.lang || 'en'
    },
    getToolsOptions: {
      dataProvider: stubDataProvider
    }
  };

  const result = await ChatEngine.createStream(input);
  return result.toUIMessageStreamResponse();
}
