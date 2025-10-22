import { setPromptVars } from '@openvaa/llm-refactor';
import { z } from 'zod';
import { loadPrompt } from './promptLoader';
import type { LLMProvider } from '@openvaa/llm-refactor';
import type { ModelMessage } from 'ai';

// ----------------------------------------
// RESPONSE SCHEMA
// ----------------------------------------
const queryReformulationSchema = z.object({
  standaloneQuery: z.string().nullable()
});

/**
 * Reformulates conversational messages into standalone queries for vector search
 * Returns null if the message doesn't require information retrieval
 *
 * @param messages - Array of user messages in chronological order (oldest first, latest last)
 * @param provider - LLM provider for query reformulation
 * @returns Standalone query string suitable for retrieval, or null if no retrieval needed
 *
 * @example
 * ```typescript
 * const query = await reformulateQuery({
 *   messages: [
 *     "What is the voting age in Finland?",
 *     "What about in Sweden?"
 *   ],
 *   provider: llmProvider
 * });
 * // Returns: "What is the voting age in Sweden?"
 * ```
 *
 * @example
 * ```typescript
 * const query = await reformulateQuery({
 *   messages: ["Thanks!"],
 *   provider: llmProvider
 * });
 * // Returns: null
 * ```
 */
export async function reformulateQuery({
  messages,
  provider
}: {
  messages: Array<string>;
  provider: LLMProvider;
}): Promise<string | null> {
  if (messages.length === 0) {
    throw new Error('reformulateQuery requires at least one message');
  }

  // Load prompt template
  const promptTemplate = (await loadPrompt({ promptFileName: 'queryReformulation' })).prompt;

  // Format conversation history with latest message highlighted
  const formattedHistory = messages
    .map((msg, idx) => {
      if (idx === messages.length - 1) {
        // Highlight the latest message
        return `<<LATEST_MESSAGE>> ${msg} <</LATEST_MESSAGE>>`;
      }
      return `User: ${msg}`;
    })
    .join('\n\n');

  // Fill prompt variables
  const filledPrompt = setPromptVars({
    promptText: promptTemplate,
    variables: {
      conversationHistory: formattedHistory
    }
  });

  // Call LLM
  const response = await provider.generateObject({
    messages: [{ role: 'user', content: filledPrompt } as ModelMessage],
    schema: queryReformulationSchema,
    temperature: 0,
    maxRetries: 3,
    validationRetries: 3
  });

  return response.object.standaloneQuery;
}
