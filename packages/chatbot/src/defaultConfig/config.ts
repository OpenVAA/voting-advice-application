import { LLMProvider } from '@openvaa/llm-refactor';
import { getOnboardingMessage } from './onboardingMessages';
import { getVectorStore } from './vectorStore';

// TODO: implement more complex configuration to make sure we have an easy way to configure chatbot state and behavior. 
export async function getChatbotConfiguration(openAIAPIKey: string) {
  return {
    vectorStore: await getVectorStore(openAIAPIKey),
    chatProvider: getChatProvider(openAIAPIKey),
    onboardingMessage: getOnboardingMessage('en')
  };
}

export function getChatProvider(openAIAPIKey: string): LLMProvider {
  return new LLMProvider({
    provider: 'openai',
    apiKey: openAIAPIKey,
    modelConfig: { primary: 'gpt-4o' }
  });
}
