import { ENGLISH_CONFIG } from './english';
import { FINNISH_CONFIG } from './finnish';
/**
 * Provides language-specific configuration for argument condensation
 */
export const LanguageConfigs = {
    fi: FINNISH_CONFIG,
    en: ENGLISH_CONFIG
};
/**
 * Helper function to get language config by locale code
 * @param locale The locale code (e.g., 'fi', 'en')
 * @returns The corresponding language config or Finnish as fallback
 */
export function getLanguageConfig(locale) {
    if (locale === 'fi')
        return FINNISH_CONFIG;
    if (locale === 'en')
        return ENGLISH_CONFIG;
    return FINNISH_CONFIG; // Default fallback
}
