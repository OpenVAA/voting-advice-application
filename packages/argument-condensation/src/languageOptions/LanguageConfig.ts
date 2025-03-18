/**
 * Supported languages for argument condensation
 */
export type SupportedLanguage = 'fi' | 'en';

/**
 * Configuration for language-specific prompting
 * @interface LanguageConfig
 */
export interface LanguageConfig {
    /** LLM instructions for first step of general condensation (no specific point of view) */
    instructionsGeneral: string;

    /** LLM instructions for the reduction part of general condensation */
    reduceInstructionsGeneral: string;

    /** LLM instructions for the first step ofsupporting condensation */
    instructionsSupportive: string;

    /** LLM instructions for the reduction part of supporting condensation */
    reduceInstructionsSupporting: string;

    /** LLM instructions for the first step of opposing condensation */
    instructionsOpposing: string;

    /** LLM instructions for the reduction part of opposing condensation */
    reduceInstructionsOpposing: string;

    /** Instruction reminder at the end of the LLM prompt (opposing condensation) */
    opposingReminder: string;
    
    /** Header for displaying existing arguments section in the LLM prompt */
    existingArgumentsHeader: string;
    
    /** Header for displaying the new comments section in the LLM prompt */
    newCommentsHeader: string;
    
    /** Header for output format section in the LLM prompt */
    outputFormatHeader: string;
    
    /** Configuration for output formatting */
    outputFormat: {
        /** Prefix for new arguments in the output */
        argumentPrefix: string;
        
        /** Output placeholder for the condensed argument */
        argumentPlaceholder: string;
    };
    
    /** Prefix for comments in the input prompt */
    inputCommentPrefix: string;
    
    /** Prefix for existing arguments in the input prompt */
    existingArgumentPrefix: string;
}
