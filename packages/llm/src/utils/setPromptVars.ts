import { DefaultLogger } from '@openvaa/core';
import type { Logger } from '@openvaa/core';

/**
 * Utility function to embed template literals in prompt text with error handling
 * @param promptText - The prompt text with {{variable}} placeholders
 * @param variables - The variables to embed
 * @param strict - Whether to throw an error if variables are missing or leave placeholders
 * @param logger - The logger to use for warnings
 * @returns The prompt text string with variables embedded
 */
export function setPromptVars({
  promptText,
  variables,
  strict = true,
  logger = new DefaultLogger()
}: {
  promptText: string;
  variables: Record<string, unknown>;
  strict?: boolean;
  logger?: Logger;
}): string {
  let result = promptText;
  const missingVars: Array<string> = [];

  // Find all {{variable}} placeholders in the prompt
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const requiredVars = new Set<string>();
  let match;

  while ((match = placeholderRegex.exec(promptText)) !== null) {
    requiredVars.add(match[1]);
  }

  // Replace template variables using {{variable}} syntax
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const valueStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), valueStr);
  }

  // Check for missing variables
  for (const requiredVar of requiredVars) {
    if (!(requiredVar in variables)) {
      missingVars.push(requiredVar);
    }
  }

  if (missingVars.length > 0) {
    const remainingErrorMsg = `Prompt is missing required variables: ${missingVars.join(', ')}`;
    if (strict) throw new Error(remainingErrorMsg);
    logger.warning(`setPromptVars: ${remainingErrorMsg}`);
  }
  // If not strict, the output will have the missing variables as {{variable}} placeholders
  return result;
}
