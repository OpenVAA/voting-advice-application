/**
 * Utility function to embed template literals in prompt text
 * @param promptText The prompt text with {{variable}} placeholders
 * @param variables The variables to embed
 * @returns The prompt text with variables embedded
 */
export function setPromptVars( 
  { promptText, variables }: { promptText: string, variables: Record<string, unknown> }
 ): string {
  let result = promptText;

  // Replace template variables using {{variable}} syntax
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const valueStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), valueStr);
  }

  return result;
}
