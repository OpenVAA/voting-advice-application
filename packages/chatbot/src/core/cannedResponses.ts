import type { CannedResponseCategory, QueryCategory } from './queryCategories';

/**
 * Canned responses for canned response categories
 */
export const CANNED_RESPONSES: Record<CannedResponseCategory, string> = {
  meta: "I'm a voting advice assistant focused on the 2024 EU elections. I can help you understand party positions, election procedures, EU institutions, and electoral systems. What would you like to know?",
  ambiguous: "I'm sorry, I'm not sure what you mean. Could you clarify please?",
  inappropriate:
    "I'm here to help with questions about the 2024 EU elections. Please keep our conversation constructive and on-topic.",
  eu2024_candidate:
    "I don't have detailed candidate information, but I can help with party positions and election information. What would you like to know?",
  other_election: 'I focus specifically on the 2024 EU elections. How can I help you with those?',
  offtopic: "I'm here to help with the 2024 EU elections. Do you have any questions about that?"
};

/**
 * Get the canned response for a category
 * Returns undefined if no canned response is defined
 */
export function getCannedResponse(category: QueryCategory): string | undefined {
  return CANNED_RESPONSES[category as CannedResponseCategory];
}
