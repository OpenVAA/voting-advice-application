import * as fs from 'fs';
import * as yaml from 'js-yaml';
import path from 'path';

/**
 * Load the evaluation prompt template from YAML file. Expects yaml file to have a promptText key.
 */
export function loadPromptTemplate(baseDirInPrompts: string, filename: string): string {
  const promptPath = path.join(__dirname, `../prompts/${baseDirInPrompts}/${filename}.yaml`);
  console.info('utils/loadPrompt: loading prompt from ', promptPath);
  try {
    const content = fs.readFileSync(promptPath, 'utf-8');
    const promptData = yaml.load(content) as { promptText?: string };

    if (!promptData.promptText) {
      throw new Error('Variable "promptText" not found in YAML file');
    }

    return promptData.promptText;
  } catch (error) {
    throw new Error(`Failed to load evaluation prompt from ${promptPath}: ${error}`);
  }
}
