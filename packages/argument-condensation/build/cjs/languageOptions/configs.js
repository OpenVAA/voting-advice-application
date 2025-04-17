"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageConfigs = void 0;
exports.getLanguageConfig = getLanguageConfig;
const english_1 = require("./english");
const finnish_1 = require("./finnish");
/**
 * Provides language-specific configuration for argument condensation
 */
exports.LanguageConfigs = {
    fi: finnish_1.FINNISH_CONFIG,
    en: english_1.ENGLISH_CONFIG
};
/**
 * Helper function to get language config by locale code
 * @param locale The locale code (e.g., 'fi', 'en')
 * @returns The corresponding language config or Finnish as fallback
 */
function getLanguageConfig(locale) {
    if (locale === 'fi')
        return finnish_1.FINNISH_CONFIG;
    if (locale === 'en')
        return english_1.ENGLISH_CONFIG;
    return finnish_1.FINNISH_CONFIG; // Default fallback
}
