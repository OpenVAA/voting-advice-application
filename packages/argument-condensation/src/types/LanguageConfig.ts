/**
 * Supported languages for argument condensation
 */
export type SupportedLanguage = 'fi' | 'en';

// Configure each field according to your language
// See e.g. the English config file for how to do this
/**
 * Configuration for language-specific prompts and formatting
 * @interface LanguageConfig
 */
export interface LanguageConfig {
    /** LLM instructions for the general condensation */
    instructionsGeneral: string;

    /** LLM instructions for the recursive part of general condensation */
    recursiveInstructionsGeneral: string;

    /** LLM instructions for the supporting condensation */
    instructionsSupportive: string;

    /** LLM instructions for the recursive part of supporting condensation */
    recursiveInstructionsSupporting: string;

    /** LLM instructions for the opposing condensation */
    instructionsOpposing: string;

    /** LLM instructions for the recursive part of opposing condensation */
    recursiveInstructionsOpposing: string;

    /** Reminder at the end of the LLM prompt for opposing condensation */
    opposingReminder: string;
    
    /** Header for displaying existing arguments section in the LLM prompt */
    existingArgumentsHeader: string;
    
    /** Header for displaying new comments section in the LLM prompt */
    newCommentsHeader: string;
    
    /** Header for output format section in the LLM prompt */
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
