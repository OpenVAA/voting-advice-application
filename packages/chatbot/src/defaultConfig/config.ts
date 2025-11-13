import { getOnboardingMessage } from './onboardingMessages';
import { getPhaseRouterProvider, getQueryReformulationProvider, getQueryRoutingProvider } from './providers';
import { getVectorStore } from './vectorStore';

export async function getChatbotConfiguration() {
  return {
    vectorStore: await getVectorStore(),
    queryRoutingProvider: getQueryRoutingProvider(),
    queryReformulationProvider: getQueryReformulationProvider(),
    phaseRouterProvider: getPhaseRouterProvider(),
    onboardingMessage: getOnboardingMessage('en')
  };
}
