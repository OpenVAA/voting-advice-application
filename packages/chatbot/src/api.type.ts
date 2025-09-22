import type { UIMessage } from 'ai';
import type { ChatDataProvider } from './core/chatDataProvider.type';

// Input type for chatbot API requests
export type ChatbotAPIInput = {
  // conversationId: string; is this ever needed?
  messages: Array<UIMessage>;
  context: {
    locale: string;
    // userRole: 'voter'; maybe we can expect that we are talking to a voter?
  };
  getToolsOptions?: {
    dataProvider?: ChatDataProvider;
    includeVectorSearch?: boolean;
    includeWebSearch?: boolean;
    includeCustomTools?: boolean;
  };
};
