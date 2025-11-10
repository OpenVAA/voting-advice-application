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
  // Currently only supports English, but structure allows for i18n expansion. TODO: i18n 
  if (locale === 'en') {
    return `Hello! I'm your EU 2024 election assistant.

Some things I can help you with:
• Election procedures like how to vote and when
• Different political topics like immigration, climate change, etc.
• What the EU Parliament is and why these elections are important
• Party positions on election topics

Some things I can't do:
• Find information about election candidates
• Provide specific voting recommendations
• Answer off-topic questions unrelated to EU elections
• Express political opinions or predictions

What would you like to learn about?`; 
  }

  // Fallback to English if locale not supported
  console.warn(`Unsupported locale: ${locale}. Falling back to English.`);
  return getOnboardingMessage('en');
}
