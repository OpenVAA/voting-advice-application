import { z } from 'zod';
import { loadPrompt } from './promptLoader';
import type { LLMProvider } from '@openvaa/llm-refactor';
import type { ModelMessage } from 'ai';
import type { ConversationPhase } from '../controller/chatbotController.type';

/**
 * Zod schema for conversation phase validation
 * Ensures LLM output is one of the defined phases
 */
const ConversationPhaseSchema = z.object({
  phase: z.enum([
    'intro_to_chatbot_use',
    'user_intent_extraction',
    'intent_resolution',
    'alignment_check'
  ])
});

/**
 * Determine conversation phase from recent messages using LLM
 *
 * Analyzes the last 3-5 messages to determine which phase the conversation is in.
 * Uses a lightweight LLM model (gpt-4o-mini) with structured output for fast, cheap routing.
 *
 * @param messages - Recent conversation messages (automatically limited to last 5)
 * @param phaseRouterProvider - LLM provider for phase detection
 * @returns Validated conversation phase
 *
 * @example
 * ```typescript
 * const phase = await determineConversationPhase(
 *   conversationMessages,
 *   phaseRouterProvider
 * );
 * // phase is one of: 'intro_to_chatbot_use' | 'user_intent_extraction' | 'intent_resolution' | 'alignment_check'
 * ```
 */
export async function determineConversationPhase(
  messages: Array<ModelMessage>,
  phaseRouterProvider: LLMProvider
): Promise<ConversationPhase> {
  // Load phase router prompt
  const promptTemplate = await loadPrompt({ promptFileName: 'phaseRouter' });

  // Take only last 5 messages to keep context window small
  const recentMessages = messages.slice(-5);

  // Call LLM with structured output (Zod schema validation)
  const result = await phaseRouterProvider.generateObject({
    schema: ConversationPhaseSchema,
    messages: [{ role: 'system', content: promptTemplate.prompt }, ...recentMessages],
    temperature: 0,
    modelConfig: { primary: 'gpt-4o-mini' }
  });

  return result.object.phase as ConversationPhase;
}
