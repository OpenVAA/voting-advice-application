import { setPromptVars } from '@openvaa/llm-refactor';
import type { QueryCategory } from '../controller/chatbotController.type';

/**
 * Canned responses for canned response categories
 */
export const CANNED_RESPONSES: Record<string, string> = {
  inappropriate: "Our system has flagged your message as inappropriate. I'm here to help with questions about the 2024 EU elections. Please keep our conversation constructive and on-topic or your usage rights to this chatbot will be removed. If you have any questions related to the EU, feel free to ask!",
  not_possible: 'Our system has flagged your message as out of my knowledge capabilities. This may be a mistake. You can try asking the question again with more specific details. Just to remind you, here is a list of topics I can help with: \n\n{{topics}}', // TODO: instead of listing these here, we should have a centralized place for users to navigate to
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
