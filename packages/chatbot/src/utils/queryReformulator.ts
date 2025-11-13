import { type LLMProvider, setPromptVars } from '@openvaa/llm-refactor';
import { z } from 'zod';
import { formatConversationHistory } from './messageHistoryFormatter';
import { loadPrompt } from './promptLoader';
import type { ConversationState } from '../controller/chatbotController.type';

/**
 * Zod schema for query reformulation output
 * Maps topic keys to arrays of reformulated queries
 */
const QueryReformulationSchema = z.object({
  topics: z.record(z.string(), z.array(z.string()))
});

/**
 * Reformulate user queries for optimized RAG retrieval
 *
 * Analyzes conversation history to:
 * 1. Identify distinct information needs/topics
 * 2. Generate k diverse reformulations per topic for better vector search coverage
 *
 * Multiple reformulations help overcome the "embedding space lottery" - different
 * phrasings can retrieve different relevant documents due to vocabulary mismatch
 * or semantic nuances.
 *
 * @param state - Current conversation state with messages
 * @param provider - LLM provider for reformulation (lightweight model recommended)
 * @param k - Number of reformulations per topic (default: 3)
 * @returns Object mapping topics to arrays of reformulated queries
 *
 * @example
 * ```typescript
 * const reformulations = await reformulateQuery(state, provider, 3);
 * // Returns:
 * // {
 * //   "climate_policies": [
 * //     "political party positions on climate change",
 * //     "EU election party stances climate action",
 * //     "which parties support green energy transition"
 * //   ],
 * //   "immigration_stances": [
 * //     "party positions on immigration asylum policy",
 * //     "EU election views on migration border control",
 * //     "parties with stricter vs open immigration policies"
 * //   ]
 * // }
 * ```
 */
export async function reformulateQuery(
  state: ConversationState,
  provider: LLMProvider,
  k: number = 3
): Promise<Record<string, Array<string>>> {
  // Load reformulation prompt
  const promptTemplate = await loadPrompt({ promptFileName: 'queryReformulator' });

  // Format conversation history (last 4 user + 4 assistant messages)
  const formattedHistory = formatConversationHistory(state.messages, {
    maxUserMessages: 4,
    maxAssistantMessages: 4,
    highlightLatest: true
  });

  // Fill prompt template with variables
  const filledPrompt = setPromptVars({
    promptText: promptTemplate.prompt,
    variables: {
      messages: formattedHistory,
      k: k.toString()
    },
    strict: true
  });

  // Call LLM with structured output (Zod schema validation)
  const result = await provider.generateObject({
    schema: QueryReformulationSchema,
    messages: [
      {
        role: 'user',
        content: filledPrompt
      }
    ],
    temperature: 1, // Some creativity for diverse reformulations
    modelConfig: { primary: 'gpt-4o-mini' } // Fast, cheap model
  });

  return result.object.topics;
}