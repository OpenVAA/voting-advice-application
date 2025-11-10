import { type LLMProvider, setPromptVars } from '@openvaa/llm-refactor';
import { z } from 'zod';
import { loadPrompt } from './promptLoader';
import type { ConversationPhase, ConversationState } from '../controller/chatbotController.type';

/**
 * Zod schema for conversation phase validation
 * Ensures LLM output is one of the defined phases
 */
const ConversationPhaseSchema = z.object({
  phase: z.enum(['user_intent_extraction', 'intent_resolution'])
});

/**
 * Determine conversation phase from recent messages using LLM
 *
 * Analyzes the last 3-5 messages to determine which phase the conversation is in.
 * Uses a lightweight LLM model (gpt-4o-mini) with structured output for fast, cheap routing.
 *
 * @param messages - Recent conversation messages (automatically limited to last 5)
 * @param provider - LLM provider for phase detection
 * @returns Validated conversation phase
 *
 * @example
 * ```typescript
 * const phase = await determineConversationPhase(
 *   state,
 *   provider
 * );
 * ```
 */
export async function determineConversationPhase(
  state: ConversationState,
  provider: LLMProvider
): Promise<ConversationPhase> {
  // Load phase router prompt
  const promptTemplate = await loadPrompt({ promptFileName: 'phaseRouter' });

  // TODO: more advanced phase detection logic.
  // Take only last 5 messages to keep context window small
  const recentMessages = state.messages.slice(-7);

  // Format conversation history with latest message highlighted
  const formattedHistory = recentMessages
    .map((msg, idx) => {
      if (idx === recentMessages.length - 1) {
        // Highlight the latest message
        return `<<LATEST_MESSAGE>> User: ${msg} <</LATEST_MESSAGE>>`;
      }
      return `User: ${msg}`;
    })
    .join('\n\n');

  // Call LLM with structured output (Zod schema validation)
  const result = await provider.generateObject({
    schema: ConversationPhaseSchema,
    messages: [
      {
        role: 'system',
        content: setPromptVars({ 
          promptText: promptTemplate.prompt, variables: { messages: formattedHistory } 
        })
      }
    ],
    temperature: 0,
    modelConfig: { primary: 'gpt-4o-mini' }
  });

  return result.object.phase as ConversationPhase;
}
