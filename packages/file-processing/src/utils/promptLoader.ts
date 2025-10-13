import { extractPromptVars, validatePromptVars } from '@openvaa/llm-refactor';
import { readFile } from 'fs/promises';
import { load as loadYaml } from 'js-yaml';
import { join } from 'path';

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

  const usedVars = extractPromptVars(parsed.prompt);

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