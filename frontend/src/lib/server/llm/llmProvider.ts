import { type LLMProvider, OpenAIProvider } from '@openvaa/llm';
import { constants } from '$lib/server/constants';

/**
 * Get an LLMProvider instance based on env settings.
 */
export function getLLMProvider(): LLMProvider {
  // TODO: fix docker compose to get llm key from env
  // Currently constants.LLM_OPENAI_API_KEY fails, so we use a working fallback for now
  const apiKey = constants.LLM_OPENAI_API_KEY || process.env.LLM_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing LLM_OPENAI_API_KEY in environment');
  }
  return new OpenAIProvider({
    model: 'gpt-4o',
    apiKey,
    maxContextTokens: 4096
  });
}
