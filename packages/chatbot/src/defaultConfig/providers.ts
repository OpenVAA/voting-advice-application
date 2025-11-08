import { LLMProvider } from '@openvaa/llm-refactor';
import { OPENAI_API_KEY } from '../apiKey';


export function getQueryReformulationProvider(): LLMProvider {
  return new LLMProvider({
    provider: 'openai',
    apiKey: OPENAI_API_KEY,
    modelConfig: { primary: 'gpt-4.1-nano-2025-04-14' }
  });
}

export function getPhaseRouterProvider(): LLMProvider {
  return new LLMProvider({
    provider: 'openai',
    apiKey: OPENAI_API_KEY,
    modelConfig: { primary: 'gpt-4o-mini', useCachedInput: false }
  });
}
