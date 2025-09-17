import type { UIMessage } from 'ai';

// Input type for chatbot API requests
export type ChatbotAPIInput = {
  // conversationId: string; is this ever needed?
  messages: Array<UIMessage>;
  context: {
    locale: string;
    // userRole: 'voter'; maybe we can expect that we are talking to a voter?
  };
};
