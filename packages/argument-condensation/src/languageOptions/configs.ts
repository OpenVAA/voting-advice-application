import { ENGLISH_CONFIG } from './english';
import { FINNISH_CONFIG } from './finnish';
import { LanguageConfig } from './languageConfig.type';
/**
 * Provides language-specific configuration for argument condensation
 */
export const LanguageConfigs: Record<string, LanguageConfig> = {
  fi: FINNISH_CONFIG,
  en: ENGLISH_CONFIG
};

/**
 * Supported language codes
 */
export type SupportedLanguage = keyof typeof LanguageConfigs;

/**
 * Helper function to get language config by locale code
 * @param locale The locale code (e.g., 'fi', 'en')
 * @returns The corresponding language config or Finnish as fallback
 */
export function getLanguageConfig(locale: string): LanguageConfig {
  if (locale === 'fi') return FINNISH_CONFIG;
  if (locale === 'en') return ENGLISH_CONFIG;
  return FINNISH_CONFIG; // Default fallback
}
