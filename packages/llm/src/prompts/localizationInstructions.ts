import { staticSettings } from '@openvaa/app-shared';
import { setPromptVars } from '../utils';

const englishLocalizationPrompt = `### CRUCIAL: Provide your entire response in {{language}}.
Even though the examples or input data may be in a different language, the output is expected to be in {{language}}.

### REMEMBER: The OUTPUT NEEDS TO BE in {{language}}. Your OUTPUT MUST BE WRITTEN IN {{language}}.`;

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
 *
 * Generated dynamically from staticSettings.supportedLocales using the same
 * source of truth as SvelteKit locale routes.
 */
export const LOCALIZATION_INSTRUCTIONS: Record<string, string> = Object.fromEntries(
  staticSettings.supportedLocales.map(locale => [
    locale.code,
    locale.isDefault
      ? ''
      : setPromptVars({
          promptText: englishLocalizationPrompt,
          variables: { language: locale.name }
        })
  ])
);

/**
 * Languages that we support in prompt files.
 * Each language code corresponds to a directory in the prompts folder.
 */
export const SUPPORTED_PROMPT_LANGUAGES = ['en', 'fi', 'sv'] as const;

export type PromptLanguage = (typeof SUPPORTED_PROMPT_LANGUAGES)[number];
