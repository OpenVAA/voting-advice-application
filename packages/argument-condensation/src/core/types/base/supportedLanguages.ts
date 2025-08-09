// Update when adding support for new languages
export const SUPPORTED_LANGUAGES = ['fi', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
