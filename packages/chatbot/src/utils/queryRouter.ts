// packages/chatbot/src/utils/queryRouter.ts
import { type LLMProvider, setPromptVars } from '@openvaa/llm-refactor';
import { z } from 'zod';
import { formatConversationHistory } from './messageHistoryFormatter';
import { loadPrompt } from './promptLoader';
import type { ModelMessage } from 'ai';
import type { QueryCategory, QueryRoutingResult } from '../controller/chatbotController.type';

/**
 * Decide whether the latest message is appropriate, inappropriate, or not_possible.
 * For appropriate, also ask for a reformulated standalone question (rephrased) for RAG.
 */
export async function routeQuery({
  messages,
  provider,
  chatbotSkills,
  fallbackTopics,
  outOfScopeTopics
}: {
  messages: Array<ModelMessage>;
  provider: LLMProvider;
  chatbotSkills: Array<string>;
  fallbackTopics: Array<string>;
  outOfScopeTopics: Array<string>;
}): Promise<QueryRoutingResult> {
  if (messages.length === 0) {
    throw new Error('decideAction requires at least one message');
  }

  const ActionSchema = z.object({
    action: z.enum(['appropriate', 'inappropriate', 'not_possible']),
    rephrased: z.string().nullable().optional()
  });

  const promptTemplate = (await loadPrompt({ promptFileName: 'queryRouter' })).prompt;

  const formattedHistory = formatConversationHistory(messages, {
    maxUserMessages: 4,
    maxAssistantMessages: 4,
    highlightLatest: true
  });

  const filledPrompt = setPromptVars({
    promptText: promptTemplate,
    variables: {
      possibleActions: 'appropriate | inappropriate | not_possible',
      chatbotSkills: chatbotSkills.join('\n- '),
      fallbackTopics: fallbackTopics.join('\n- '),
      outOfScopeTopics: outOfScopeTopics.join('\n- '),
      conversationHistory: formattedHistory
    },
    strict: false
  });

  const response = await provider.generateObject({
    messages: [{ role: 'user', content: filledPrompt } as ModelMessage],
    schema: ActionSchema,
    temperature: 0,
    maxRetries: 1,
    validationRetries: 1
  });

  return {
    category: response.object.action as QueryCategory,
    costs: {
      total: 0,
      input: 0,
      output: 0
    },
    durationMs: response.latencyMs
  };
}
