import { getPhaseRouterProvider, getQueryReformulationProvider } from './providers';
import { getVectorStore } from './vectorStore';
import type { LLMProvider } from '@openvaa/llm-refactor';
import type { MultiVectorStore } from '@openvaa/vector-store';

export type ChatbotConfiguration = {
  vectorStore: Promise<MultiVectorStore>;
  queryRoutingProvider: LLMProvider;
  phaseRouterProvider: LLMProvider;
};

export function getChatbotConfiguration(): ChatbotConfiguration {
  return {
    vectorStore: getVectorStore(),
    queryRoutingProvider: getQueryReformulationProvider(),
    phaseRouterProvider: getPhaseRouterProvider()
  };
}

export { getOnboardingMessage } from './onboardingMessages';
