import { readFile } from 'fs/promises';
import { load } from 'js-yaml';
import { join } from 'path';
import type { PromptTemplate } from '../types';

/**
 * Load a prompt template from YAML file
 */
export async function loadPrompt(promptFileName: string, language: string): Promise<PromptTemplate> {
  try {
    const filePath = join(process.cwd(), 'src', 'prompts', language, `${promptFileName}.yaml`);
    const fileContent = await readFile(filePath, 'utf-8');
    const prompt = load(fileContent) as PromptTemplate;

    if (!prompt.systemPrompt || !prompt.userPrompt || !prompt.examples) {
      throw new Error(`Invalid prompt template: missing required fields in ${promptFileName}.yaml`);
    }

    return prompt;
  } catch (error) {
    throw new Error(`Failed to load prompt template ${promptFileName}: ${error}`);
  }
}
