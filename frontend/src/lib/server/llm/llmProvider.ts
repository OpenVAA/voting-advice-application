import { type LLMProvider, OpenAIProvider } from '@openvaa/llm';
import { constants } from '$lib/server/constants';

/**
 * Get an LLMProvider instance based on env settings.
 */
export function getLLMProvider(): LLMProvider {
  const apiKey = constants.LLM_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing LLM_OPENAI_API_KEY in environment');
  }
  return new OpenAIProvider({
    model: 'gpt-4o',
    apiKey,
    maxContextTokens: 4096
  });
}
