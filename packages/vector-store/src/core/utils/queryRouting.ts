import { setPromptVars } from '@openvaa/llm-refactor';
import { z } from 'zod';
import { loadPrompt } from './promptLoader';
import type { LLMProvider } from '@openvaa/llm-refactor';
import type { ModelMessage } from 'ai';

// ----------------------------------------
// RESULT INTERFACE
// ----------------------------------------

/**
 * Result from query routing
 * Generic interface that works with any set of categories
 */
export interface QueryRoutingResult {
  /**
   * The identified category (validated against provided categories)
   */
  category: string;

  /**
   * The reformulated query as a standalone question
   * null for certain category types (e.g., ambiguous, conversational)
   */
  rephrased: string | null;
}

/**
 * Routes and reformulates conversational queries into standalone questions
 *
 * Generic utility that accepts category definitions from the caller,
 * allowing vector-store to remain domain-agnostic while providing
 * query routing and reformulation capabilities.
 *
 * @param messages - Array of user messages in chronological order (oldest first, latest last)
 * @param provider - LLM provider for query routing
 * @param categories - Array of valid category strings (e.g., ['policy', 'conversational', 'meta'])
 * @returns Object with category and reformulated query
 *
 * @example
 * ```typescript
 * const result = await routeQuery({
 *   messages: [
 *     "What is the voting age in Finland?",
 *     "What about in Sweden?"
 *   ],
 *   provider: llmProvider,
 *   categories: ['eu2024_policy', 'eu2024_process', 'conversational']
 * });
 * // Returns: { category: "eu2024_process", rephrased: "What is the voting age in Sweden?" }
 * ```
 *
 * @example
 * ```typescript
 * const result = await routeQuery({
 *   messages: ["Thanks!"],
 *   provider: llmProvider,
 *   categories: ['eu2024_policy', 'conversational', 'meta']
 * });
 * // Returns: { category: "conversational", rephrased: null }
 * ```
 */
export async function routeQuery({
  messages,
  provider,
  categories
}: {
  messages: Array<string>;
  provider: LLMProvider;
  categories: ReadonlyArray<string>;
}): Promise<QueryRoutingResult> {
  if (messages.length === 0) {
    throw new Error('routeQuery requires at least one message');
  }

  if (categories.length === 0) {
    throw new Error('routeQuery requires at least one category');
  }

  // Build dynamic schema from provided categories
  // Zod enum requires at least one value, so we cast to the required tuple type
  const queryRoutingSchema = z.object({
    category: z.enum(categories as [string, ...Array<string>]),
    rephrased: z.string().nullable()
  });

  // Load prompt template
  const promptTemplate = (await loadPrompt({ promptFileName: 'queryRouting' })).prompt;

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

  // Call LLM with dynamic schema
  const response = await provider.generateObject({
    messages: [{ role: 'user', content: filledPrompt } as ModelMessage],
    schema: queryRoutingSchema,
    temperature: 0,
    maxRetries: 1,
    validationRetries: 1
  });

  return {
    category: response.object.category,
    rephrased: response.object.rephrased
  };
}
