import { type ChatbotAPIInput, ChatEngine } from '@openvaa/chatbot';
import { convertUIMessagesToModelMessages } from '$lib/chatbot/adHocMessageConvert';
import { stubDataProvider } from './stubDataProvider';

// API endpoint for chat functionality
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST({ request, params }: { request: Request; params: any }) {
  const { messages: uiMessages } = await request.json();

  const messages = convertUIMessagesToModelMessages(uiMessages);

  const input: ChatbotAPIInput = {
    messages,
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
