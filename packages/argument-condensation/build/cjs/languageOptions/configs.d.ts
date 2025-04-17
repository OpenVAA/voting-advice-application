import { LanguageConfig } from './languageConfig.type';
/**
 * Provides language-specific configuration for argument condensation
 */
export declare const LanguageConfigs: Record<string, LanguageConfig>;
/**
 * Supported language codes
 */
export type SupportedLanguage = keyof typeof LanguageConfigs;
/**
 * Helper function to get language config by locale code
 * @param locale The locale code (e.g., 'fi', 'en')
 * @returns The corresponding language config or Finnish as fallback
 */
export declare function getLanguageConfig(locale: string): LanguageConfig;
//# sourceMappingURL=configs.d.ts.map