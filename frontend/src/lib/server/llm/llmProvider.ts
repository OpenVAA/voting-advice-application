import { LLMProvider } from '@openvaa/llm-refactor';
import { constants } from '$lib/server/constants';

/**
 * Get an LLMProvider instance based on env settings.
 */
export function getLLMProvider(): LLMProvider {
  const apiKey = constants.LLM_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing LLM_OPENAI_API_KEY in environment');
  }
  return new LLMProvider({
    provider: 'openai',
    apiKey,
    modelConfig: {
      primary: 'gpt-4o',
      useCachedInput: false
    }
  })
};
