import type { ModelMessage } from 'ai';

// Input type for chatbot API requests
export type ChatbotAPIInput = {
  // conversationId: string; is this ever needed?
  messages: Array<ModelMessage>;
  context: {
    locale: string;
    // userRole: 'voter'; maybe we can expect that we are talking to a voter?
  };
  nSteps?: number; // number of different message types (tool-call, text, etc.) before halting
};
