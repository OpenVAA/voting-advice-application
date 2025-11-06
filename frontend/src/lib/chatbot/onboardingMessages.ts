/**
 * Onboarding messages for chatbot introduction
 *
 * These messages are derived from the intro_to_chatbot_use phase objectives
 * defined in packages/chatbot/src/core/prompts/systemPrompt_phases.yaml
 */

/**
 * Get the onboarding welcome message for the chatbot
 * This introduces the chatbot capabilities at the start of every conversation
 *
 * @param locale - User's locale for potential future i18n
 * @returns Welcome message text
 */
export function getOnboardingMessage(locale: string = 'en'): string {
  // Currently only supports English, but structure allows for i18n expansion
  if (locale === 'en') {
    return `Hello! I'm your EU election voting advice assistant. I'm here to help you understand the 2024 EU elections.

I can help you with:
• Election procedures and voting information
• Understanding political topics and policies
• General EU Parliament information and how it works
• Election-related questions and clarifications

What I can't do:
• Provide specific voting recommendations
• Answer off-topic questions unrelated to EU elections
• Express political opinions or predictions

What would you like to learn about?`;
  }

  // Fallback to English if locale not supported
  return getOnboardingMessage('en');
}
