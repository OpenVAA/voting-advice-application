import { setPromptVars } from '@openvaa/llm-refactor';
import type { QueryCategory } from '../controller/chatbotController.type';

/**
 * Canned responses for canned response categories
 */
export const CANNED_RESPONSES: Record<string, string> = {
  inappropriate: "Our system has flagged your message as inappropriate. I'm here to help with questions about the 2024 EU elections. Please keep our conversation constructive and on-topic or your conversation will be terminated.",
  not_possible: "I'm sorry, I can't help with that specifically. Just to remind you, here is a list of topics I can help with: {{topics}}",
};

/**
 * Get the canned response for a category
 * Returns undefined if no canned response is defined
 *
 * @param category - The query category
 * @param variables - Optional variables to substitute in the response (e.g., {topics: "list of topics"})
 */
export function getCannedResponse(
  category: Omit<QueryCategory, 'appropriate'>,
  variables?: Record<string, string>
): string | undefined {
  const response = CANNED_RESPONSES[category as string];

  if (!response || !variables) {
    return response;
  }

  // Use setPromptVars in non-strict mode to replace placeholders
  return setPromptVars({
    promptText: response,
    variables,
    strict: false
  });
}
