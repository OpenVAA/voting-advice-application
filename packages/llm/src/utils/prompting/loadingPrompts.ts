
/**
 * Extract all variable placeholders from prompt text
 *
 * @param promptText - The prompt text to analyze
 * @returns Array of variable names found in {{variable}} placeholders
 */
export function extractPromptVars(promptText: string): Array<string> {
  const variables: Array<string> = [];
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  let match;

  while ((match = placeholderRegex.exec(promptText)) !== null) {
    const variableName = match[1].trim();
    if (!variables.includes(variableName)) {
      variables.push(variableName);
    }
  }

  return variables;
}

/**
 * Validate that variables in prompt text match exactly with params section
 *
 * @param promptText - The prompt text to validate
 * @param params - The params section from the YAML file
 * @param promptId - The prompt ID for error reporting
 * @param yamlFile - The YAML file path for error reporting
 * @returns Validation result with details about any mismatches
 */
export function validatePromptVars({
  promptText,
  params
}: {
  promptText: string;
  params: Record<string, unknown> | undefined;
}): { valid: boolean; missing: Array<string>; extra: Array<string>; undocumented: Array<string> } {
  const variablesInText = extractPromptVars(promptText);
  const documentedVars = params ? Object.keys(params) : [];

  // Variables that are in the prompt text but not documented in params
  const undocumented = variablesInText.filter((v) => !documentedVars.includes(v));

  // Variables that are documented in params but not used in prompt text
  const extra = documentedVars.filter((v) => !variablesInText.includes(v));

  // Variables that are in the prompt text but not provided (this would be caught at runtime)
  const missing = variablesInText.filter((v) => !documentedVars.includes(v));

  const valid = undocumented.length === 0 && extra.length === 0;

  return { valid, missing, extra, undocumented };
}