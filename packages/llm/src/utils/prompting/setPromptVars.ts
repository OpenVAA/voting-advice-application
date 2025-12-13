import { BaseController } from '@openvaa/core';
import type { Controller } from '@openvaa/core';

/**
 * Utility function to embed template literals in prompt text with error handling
 * @param promptText - The prompt text with {{variable}} placeholders
 * @param variables - The variables to embed
 * @param strict - Whether to throw an error if variables are missing or leave placeholders
 * @param controller - The controller to use for warnings
 * @param optional - List of optional parameters (auto-injected as empty strings if missing; all others are required)
 * @returns The prompt text string with variables embedded
 */
export function setPromptVars({
  promptText,
  variables,
  strict = true,
  controller = new BaseController(),
  optional
}: {
  promptText: string;
  variables: Record<string, unknown>;
  strict?: boolean;
  controller?: Controller;
  optional?: Array<string>;
}): string {
  let result = promptText;
  const missingVars: Array<string> = [];

  // Find all {{variable}} placeholders in the prompt
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const varsInTemplate = new Set<string>();
  let match;

  while ((match = placeholderRegex.exec(promptText)) !== null) {
    const varName = match[1].trim();
    varsInTemplate.add(varName);
  }

  // Determine which variables are optional
  const optionalSet = optional ? new Set(optional) : new Set<string>();

  // Create a working copy of variables
  // For optional variables that are missing, provide empty strings
  const workingVariables = { ...variables };
  for (const varName of varsInTemplate) {
    if (optionalSet.has(varName) && !(varName in workingVariables)) {
      workingVariables[varName] = '';
    }
  }

  // Replace template variables using {{variable}} syntax
  for (const [key, value] of Object.entries(workingVariables)) {
    const placeholder = `{{${key}}}`;
    const valueStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), valueStr);
  }

  // Check for missing REQUIRED variables (those not in optional list)
  for (const varName of varsInTemplate) {
    if (!optionalSet.has(varName) && !(varName in variables)) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    const remainingErrorMsg = `Prompt is missing required variables: ${missingVars.join(', ')}`;
    if (strict) throw new Error(remainingErrorMsg);
    controller.warning(`setPromptVars: ${remainingErrorMsg}`);
  }

  return result;
}
