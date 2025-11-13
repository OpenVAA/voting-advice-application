import type { QueryCategory } from '../controller/chatbotController.type';

/**
 * Canned responses for canned response categories
 */
export const CANNED_RESPONSES: Record<string, string> = { 
  inappropriate: "Our system has flagged your message as inappropriate. I'm here to help with questions about the 2024 EU elections. Please keep our conversation constructive and on-topic or your conversation will be terminated.",
  not_possible: "I'm sorry, I can't help with that specifically. Just to remind you, here is a list of topics I can help with: {{topics}}", // TODO: create prompt for this to be dynamic
};

/**
 * Get the canned response for a category
 * Returns undefined if no canned response is defined
 */
export function getCannedResponse(category: Omit<QueryCategory, 'appropriate'>): string | undefined {
  return CANNED_RESPONSES[category as string];
}
