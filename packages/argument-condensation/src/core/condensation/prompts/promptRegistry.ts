import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { CONDENSATION_TYPE, CondensationOperation, CondensationOutputType, CondensationPrompt } from '../../types';

// TODO: (low priority): load only the specific yamls we need (currently we load all yamls for a all operations and output types)
// TODO: (low priority): make it possible load a customized prompt variable (currently this is hardcoded to 'promptText'),
// so the yaml's other variables are unreachable - if someone wants to test out different prompts using the same yaml,
// this needs to be changed. 

/**
 * Manages condensation prompts organized by operations and condensation types.
 * Loads the prompt from the 'promptText' variable of the yaml. 
 * Directory structure: core/prompts/'operation'/'condensationType'/'promptType'.yaml
 */
export class PromptRegistry {
  private promptsDir = path.join(__dirname);
  private registry: Map<string, CondensationPrompt> = new Map(); // The key is promptId!

  /**
   * Static factory method to create and initialize a PromptRegistry
   */
  static async create(language: string): Promise<PromptRegistry> {
    const registry = new PromptRegistry();
    await registry.loadPrompts(language);
    return registry;
  }

  /**
   * Recursively find all YAML files under a directory. Helper function for loadPrompts
   */
  private async findYamlFiles(dir: string): Promise<Array<string>> {
    let results: Array<string> = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(await this.findYamlFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.yaml')) {
          results.push(fullPath);
        }
      }
    } catch {
      // Directory may not exist, skip
    }
    return results;
  }

  /**
   * Load all prompts from the registry. 
   * 
   * @param language - The language to load prompts for
   */
  async loadPrompts(language: string): Promise<void> {
    const operations = await fs.readdir(`${this.promptsDir}/${language}`);

    // Iterate over all operations to load prompts for
    // Goes through all operations, even though we may not use all of them!
    // Can be optimized but it's not really a significant performance improvement
    for (const operation of operations) {
      const operationDir = path.join(`${this.promptsDir}/${language}`, operation);
      const operationStat = await fs.stat(operationDir).catch(() => null);
      if (!operationStat || !operationStat.isDirectory()) continue; // Skip if not a directory

      const outputTypes = await fs.readdir(operationDir);
      for (const outputType of outputTypes) {
        const outputTypeDir = path.join(operationDir, outputType);
        const outputTypeStat = await fs.stat(outputTypeDir).catch(() => null);
        if (!outputTypeStat || !outputTypeStat.isDirectory()) continue; // Skip if not a directory

        // Validate that the condensation type exists
        const allCondensationTypes = [
          ...Object.values(CONDENSATION_TYPE.LIKERT),
          ...Object.values(CONDENSATION_TYPE.BOOLEAN),
          ...Object.values(CONDENSATION_TYPE.CATEGORICAL)
        ];

        if (!allCondensationTypes.includes(outputType as CondensationOutputType)) {
          console.warn(`PROMPT REGISTRY: Skipping invalid output type directory: ${outputType}`);
          continue;
        }

        // Load all prompts for the current operation and output type
        const yamlFiles = await this.findYamlFiles(outputTypeDir);
        for (const yamlFile of yamlFiles) {
          try {
            const content = await fs.readFile(yamlFile, 'utf-8');
            const promptData = yaml.load(content) as {
              promptId: string;
              promptText: string;
              params?: Record<string, unknown>;
            };

            // Create the prompt object and set it in the registry for later use
            const prompt: CondensationPrompt = {
              promptId: promptData.promptId,
              promptText: promptData.promptText,
              operation: operation as CondensationOperation,
              condensationType: outputType as
                | typeof CONDENSATION_TYPE.LIKERT.PROS
                | typeof CONDENSATION_TYPE.LIKERT.CONS,
              params: (promptData.params || {}) as unknown as CondensationPrompt['params']
            };

            this.registry.set(prompt.promptId, prompt);
          } catch (error) {
            console.warn(`PROMPT REGISTRY: Failed to load prompt from ${yamlFile}:`, error);
          }
        }
      }
    }
  }

  /**
   * Get a prompt by ID
   * 
   * @param promptId - The ID of the prompt to get
   * @returns The prompt if found, otherwise undefined
   */
  getPrompt(promptId: string): CondensationPrompt | undefined {
    return this.registry.get(promptId);
  }

  /**
   * List all available prompts
   * 
   * @returns An array of all prompts in the registry (provides their IDs, operation and outputType)
   */
  listPrompts(): Array<{ promptId: string; operation: string; outputType: string }> {
    return Array.from(this.registry.values()).map((p) => ({
      promptId: p.promptId,
      operation: p.operation,
      outputType: p.condensationType
    }));
  }
}
