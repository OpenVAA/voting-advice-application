import { LLMProvider } from '@openvaa/llm-refactor';

export function getQueryRoutingProvider(openAIAPIKey: string): LLMProvider {
  return new LLMProvider({
    provider: 'openai',
    apiKey: openAIAPIKey,
    modelConfig: { primary: 'gpt-4.1-nano-2025-04-14' }
  });
}

export function getQueryReformulationProvider(openAIAPIKey: string): LLMProvider {
  return new LLMProvider({
    provider: 'openai',
    apiKey: openAIAPIKey,
    modelConfig: { primary: 'gpt-4.1-nano-2025-04-14' }
  });
}

export function getChatProvider(openAIAPIKey: string): LLMProvider {
  return new LLMProvider({
    provider: 'openai',
    apiKey: openAIAPIKey,
    modelConfig: { primary: 'gpt-4o' }
  });
}

export function getPhaseRouterProvider(openAIAPIKey: string): LLMProvider {
  return new LLMProvider({
    provider: 'openai',
    apiKey: openAIAPIKey,
    modelConfig: { primary: 'gpt-4o' }
  });
}
