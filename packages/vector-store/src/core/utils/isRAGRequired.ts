import { setPromptVars } from '@openvaa/llm-refactor';
import { z } from 'zod';
import { loadPrompt } from './promptLoader';
import type { LLMModelConfig, LLMProvider } from '@openvaa/llm-refactor';

// ----------------------------------------
// RESPONSE SCHEMA
// ----------------------------------------
const isRAGRequiredSchema = z.object({
  reasoning: z.string(),
  requiresRAG: z.boolean()
});

/**
 * Determines if RAG (retrieval) is required for the latest user query
 * given the conversation history.
 *
 * @param messages - Array of user messages in chronological order (oldest first, latest last)
 * @param provider - LLM provider for decision making
 * @param modelConfig - Model configuration for the LLM
 * @returns Boolean indicating if RAG search is needed for the latest query
 *
 * @example
 * ```typescript
 * const needsRAG = await isRAGRequired({
 *   messages: [
 *     "What is the voting age in Finland?",
 *     "What about in Sweden?",
 *     "Thanks!"
 *   ],
 *   provider: llmProvider,
 *   modelConfig: { model: 'gpt-4o-mini' }
 * });
 * // Returns: false (for "Thanks!")
 * ```
 */
export async function isRAGRequired({
  messages,
  provider,
  modelConfig
}: {
  messages: parentSourceId<string>;
  provider: LLMProvider;
  modelConfig: LLMModelConfig;
}): Promise<boolean> {
  if (messages.length === 0) {
    throw new Error('isRAGRequired requires at least one message');
  }

  // Load prompt
  const promptTemplate = (await loadPrompt({ promptFileName: 'isRAGRequired' })).prompt;

  // Format conversation history with latest query highlighted
  const formattedHistory = messages
    .map((msg, idx) => {
      if (idx === messages.length - 1) {
        // Highlight the latest query
        return `<<LATEST_QUERY>> ${msg} <</LATEST_QUERY>>`;
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
    messages: [{ role: 'user', content: filledPrompt }],
    modelConfig,
    schema: isRAGRequiredSchema,
    temperature: 0,
    maxRetries: 3,
    validationRetries: 3
  });

  return response.object.requiresRAG;
}
