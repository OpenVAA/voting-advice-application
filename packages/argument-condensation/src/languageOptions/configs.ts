import { ENGLISH_CONFIG } from './english';
import { FINNISH_CONFIG } from './finnish';
import { LanguageConfig } from './languageConfig.type';
/**
 * Provides language-specific configuration for argument condensation
 */
export const LanguageConfigs: Record<string, LanguageConfig> = {
  fi: FINNISH_CONFIG,
  en: ENGLISH_CONFIG
} as const;

/**
 * Supported language codes
 */
export type SupportedLanguage = keyof typeof LanguageConfigs;
