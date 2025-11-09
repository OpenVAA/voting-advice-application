import { getOnboardingMessage } from './onboardingMessages';
import { getPhaseRouterProvider, getQueryReformulationProvider } from './providers';
import { getVectorStore } from './vectorStore';

export async function getChatbotConfiguration() {
  return {
    vectorStore: await getVectorStore(),
    queryRoutingProvider: getQueryReformulationProvider(),
    phaseRouterProvider: getPhaseRouterProvider(),
    onboardingMessage: getOnboardingMessage('en')
  };
}
