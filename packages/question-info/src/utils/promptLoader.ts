import { readFile } from 'fs/promises';
import { load } from 'js-yaml';
import { join } from 'path';

/**
 * Load a prompt template from YAML file
 */
export async function loadPrompt(promptFileName: string, language: string): Promise<{ systemPrompt: string; userPrompt: string; defaultExamples: string }> {
  try {
    const filePath = join(process.cwd(), 'src', 'prompts', language, `${promptFileName}.yaml`);
    const fileContent = await readFile(filePath, 'utf-8');
    const prompt = load(fileContent) as { systemPrompt: string; userPrompt: string; defaultExamples: string };

    if (!prompt.systemPrompt || !prompt.userPrompt || !prompt.defaultExamples) {
      throw new Error(`Invalid prompt template: missing required fields in ${promptFileName}.yaml`);
    }

    return prompt;
  } catch (error) {
    throw new Error(`Failed to load prompt template ${promptFileName}: ${error}`);
  }
}
