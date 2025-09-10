/**
 * Base interface for all question info generation prompts
 */
export interface QInfoPromptBase {
  prompt: string;
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

// --------------------------------------------------
// Prompt Loader Types
// --------------------------------------------------

/**
 * Minimal shape of a generate-*.yaml prompt text
 * Validation is done against the prompt variables declared in the prompt file,
 * so the "params" field in the prompt file should be kept up-to-date if changes are made...
 */
export interface LoadedPromptYaml {
  prompt: string;
  params?: Record<string, unknown>;
}

/**
 * Minimal shape of a generate-*.yaml example
 */
export interface LoadedExampleYaml {
  question: string;
  termExample: string;
  infoSectionExample: string;
}

/**
 * Result of loading a prompt with extracted variable metadata
 */
export interface LoadedPrompt {
  prompt: string;
  params?: Record<string, unknown>;
  usedVars: Array<string>;
}
