import type { LLMProvider } from '@openvaa/llm-refactor';
import type { ModelMessage } from 'ai';
import type { RAGDependencies } from './core/tools/tools';

// Input type for chatbot API requests
export type ChatbotAPIInput = {
  // conversationId: string; is this ever needed?
  messages: Array<ModelMessage>;
  context: {
    locale: string;
    // userRole: 'voter'; maybe we can expect that we are talking to a voter?
  };
  chatProvider: LLMProvider; // LLM provider for dependency injection
  nSteps?: number; // number of different message types (tool-call, text, etc.) before halting
  ragDependencies: RAGDependencies;
};
