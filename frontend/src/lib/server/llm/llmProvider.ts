import { type LLMProvider, OpenAIProvider } from '@openvaa/llm';
import { constants } from '$lib/server/constants';

/**
 * Get an LLMProvider instance based on env settings.
 */
export function getLLMProvider(): LLMProvider {
  return new OpenAIProvider({
    model: 'gpt-4o',
    apiKey: constants.OPENAI_API_KEY,
    maxContextTokens: 4096
  });
}
