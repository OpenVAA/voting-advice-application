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
    return `Hello! I'm your EU 2024 election assistant. I'm still being developed, so I may not be able to answer all your questions.

You can ask me about:
• Different political topics like immigration, climate change, etc.
• Different branches of the EU and how they work together
• Why these elections matter
• General questions about the EU and its history

I unfortunately can't help you with:
• Information about specific candidates
• Specific voting recommendations
• Questions unrelated to EU elections

What would you like to learn about?`;
  }

  // Fallback to English if locale not supported
  console.warn(`Unsupported locale: ${locale}. Falling back to English.`);
  return getOnboardingMessage('en');
}
