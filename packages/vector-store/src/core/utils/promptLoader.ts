import { extractPromptVars, setPromptVars, validatePromptVars } from '@openvaa/llm-refactor';
import { readFile } from 'fs/promises';
import { load as loadYaml } from 'js-yaml';
import { join } from 'path';
import type { Controller } from '@openvaa/core';

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

/**
 * Load a YAML prompt file
 *
 * @param promptFileName - Name of the prompt file (without .yaml extension)
 * @returns Loaded prompt with template and metadata
 *
 * @example
 * ```ts
 * const systemPrompt = await loadPrompt({
 *   promptFileName: 'systemPrompt_v0'
 * });
 * console.log(systemPrompt.prompt); // The prompt template string
 * console.log(systemPrompt.usedVars); // Variables used in the template
 * ```
 */
export async function loadPrompt({ promptFileName }: { promptFileName: string }): Promise<LoadedPrompt> {
  const filePath = join(__dirname, '..', 'prompts', `${promptFileName}.yaml`);
  const raw = await readFile(filePath, 'utf-8');
  const parsed = loadYaml(raw) as LoadedPromptYaml;

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Invalid YAML for prompt ${promptFileName}`);
  }
  if (!parsed.prompt) {
    throw new Error(`Prompt ${promptFileName} must contain 'prompt' field`);
  }

  // Extract variables from the prompt field
  const usedVars = extractPromptVars(parsed.prompt);

  // Validate against documented params (if present)
  validatePromptVars({
    promptText: parsed.prompt,
    params: parsed.params
  });

  return {
    id: parsed.id,
    prompt: parsed.prompt,
    params: parsed.params,
    usedVars
  };
}

/**
 * Helper to embed variables into prompt text with non-strict behavior
 * and controller warnings on missing vars.
 *
 * @param promptText - The prompt template string with {{variable}} placeholders
 * @param variables - Object containing variable values to substitute
 * @param controller - Optional controller for logging warnings
 * @returns Prompt text with variables substituted
 *
 * @example
 * ```ts
 * const filled = embedPromptVars({
 *   promptText: 'Hello {{name}}',
 *   variables: { name: 'World' }
 * });
 * // Returns: 'Hello World'
 * ```
 */
export function embedPromptVars({
  promptText,
  variables,
  controller
}: {
  promptText: string;
  variables: Record<string, unknown>;
  controller?: Controller;
}): string {
  return setPromptVars({
    promptText,
    variables,
    strict: false,
    controller
  });
}
