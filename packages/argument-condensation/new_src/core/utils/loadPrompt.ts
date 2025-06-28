import path from "path";
import * as fs from 'fs';
import * as yaml from 'js-yaml';

  /**
   * Load the evaluation prompt template from YAML file. Expects yaml file to have a promptText key.
   */
  export function loadPromptTemplate(baseDirInPrompts: string, filename: string): string {

    const promptPath = path.join(__dirname, `../prompts/${baseDirInPrompts}/${filename}.yaml`);
    try {
      const content = fs.readFileSync(promptPath, 'utf-8');
      const promptData = yaml.load(content) as any;
      
      if (!promptData.promptText) {
        throw new Error('promptText not found in YAML file');
      }
      
      return promptData.promptText;
    } catch (error) {
      throw new Error(`Failed to load evaluation prompt from ${promptPath}: ${error}`);
    }
  }