/**
 * Structure of a loaded YAML prompt file
 */
export interface LoadedPromptYaml {
  id: string;
  params?: Record<string, string>;
  prompt: string;
}

/**
 * Processed prompt with extracted metadata
 */
export interface LoadedPrompt {
  id: string;
  prompt: string;
  params?: Record<string, string>;
  usedVars: Array<string>;
}
