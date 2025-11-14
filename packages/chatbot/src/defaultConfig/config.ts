import { getOnboardingMessage } from './onboardingMessages';
import {
  getChatProvider,
  getPhaseRouterProvider,
  getQueryReformulationProvider,
  getQueryRoutingProvider
} from './providers';
import { getVectorStore } from './vectorStore';

export async function getChatbotConfiguration(openAIAPIKey: string) {
  return {
    vectorStore: await getVectorStore(openAIAPIKey),
    queryRoutingProvider: getQueryRoutingProvider(openAIAPIKey),
    queryReformulationProvider: getQueryReformulationProvider(openAIAPIKey),
    phaseRouterProvider: getPhaseRouterProvider(openAIAPIKey),
    chatProvider: getChatProvider(openAIAPIKey),
    onboardingMessage: getOnboardingMessage('en')
  };
}
