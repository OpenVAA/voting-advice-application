import { type LLMProvider, setPromptVars } from '@openvaa/llm-refactor';
import { z } from 'zod';
import { formatConversationHistory } from './messageHistoryFormatter';
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
 * Analyzes recent conversation messages (last 4 user + last 4 assistant) to determine
 * which phase the conversation is in. Uses a lightweight LLM model (gpt-4o-mini) with
 * structured output for fast, cheap routing.
 *
 * @param state - Current conversation state with messages
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

  // Format conversation history with last 4 user + 4 assistant messages
  const formattedHistory = formatConversationHistory(state.messages, {
    maxUserMessages: 4,
    maxAssistantMessages: 4,
    highlightLatest: true
  });

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
