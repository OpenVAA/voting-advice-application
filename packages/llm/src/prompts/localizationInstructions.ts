/**
 * Localization instructions for LLM prompts
 *
 * These instructions are automatically injected into prompts when:
 * 1. A prompt is not available in the requested output language
 * 2. The prompt falls back to English
 * 3. The prompt template includes the {{localizationInstructions}} placeholder
 *
 * This allows us to reuse English prompts for other languages by instructing
 * the LLM to provide its response in the requested language.
 */

export const LOCALIZATION_INSTRUCTIONS: Record<string, string> = {
  en: '', // No instruction needed for English
  fi: 'Please provide your entire response in Finnish. All text, arguments, reasoning, and any other output must be written in Finnish.',
  sv: 'Please provide your entire response in Swedish. All text, arguments, reasoning, and any other output must be written in Swedish.'
};

/**
 * Languages that we support in prompt files.
 * Each language code corresponds to a directory in the prompts folder.
 */
export const SUPPORTED_PROMPT_LANGUAGES = ['en', 'fi', 'sv'] as const;

export type PromptLanguage = (typeof SUPPORTED_PROMPT_LANGUAGES)[number];
