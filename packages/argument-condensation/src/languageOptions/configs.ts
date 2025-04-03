import { LanguageConfig } from './languageConfig.type';

import { FINNISH_CONFIG } from './finnish';
import { ENGLISH_CONFIG } from './english';
/**
 * Provides language-specific configuration for argument condensation
 */
export const LanguageConfigs: Record<string, LanguageConfig> = {
    Finnish: FINNISH_CONFIG,
    English: ENGLISH_CONFIG,
} as const;

/**
 * Supported language codes
 */
export type SupportedLanguage = keyof typeof LanguageConfigs;