/**
 * Base interface for all question info generation prompts
 */
export interface QInfoPromptBase {
  systemPrompt: string;
  userPrompt: string;
  generalInstructions: string;
  neutralityRequirements: string;
  examples: string;
  question: string;
}

/**
 * Prompt and its variables for generating helpful term definitions for a question
 */
export interface TermDefPrompt extends QInfoPromptBase {
  termExtractionInstructions: string;
}

/**
 * Prompt and its variables for generating helpful info sections for a question
 */
export interface InfoSectionPrompt extends QInfoPromptBase {
  infoSectionsDefaultTopics: Array<string>;
}

export interface QInfoPromptComponents {
  termDefVars: TermDefPrompt;
  infoSectionVars: InfoSectionPrompt;
}
