/**
 * Supported languages for argument condensation
 */
export type SupportedLanguage = 'fi' | 'en';
/**
 * Configuration for language-specific prompts and formatting
 * @interface LanguageConfig
 */
export interface LanguageConfig {
    /** Main instructions for the LLM */
    instructions: string;
    /** Header for displaying existing arguments section */
    existingArgumentsHeader: string;
    /** Header for displaying new comments section */
    newCommentsHeader: string;
    /** Header for output format section */
    outputFormatHeader: string;
    /** Configuration for output formatting */
    outputFormat: {
        /** Prefix for new arguments in the output */
        argumentPrefix: string;
        /** Explanation text for argument format */
        argumentExplanation: string;
        /** Prefix for source references in the output */
        sourcesPrefix: string;
        /** Explanation text for sources format */
        sourcesExplanation: string;
    };
    /** Prefix for input comments in the prompt */
    inputCommentPrefix: string;
    /** Prefix for existing arguments in the prompt */
    outputArgumentPrefix: string;
}
