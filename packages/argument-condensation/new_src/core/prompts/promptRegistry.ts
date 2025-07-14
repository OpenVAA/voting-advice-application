import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { CondensationOperation, CondensationOperations } from '../types/condensation/operation';
import { CONDENSATION_TYPE } from '../types/condensationType';
import { CondensationPrompt } from '../types/prompt';

// TODO: (low priority): load only the specific prompt we need
// TODO: (low priority): code can be cleaned up to use
// TODO: (low priority): make it possible load a customized prompt variable (currently this is hardcoded to promptText)

/**
 * Manages condensation prompts organized by operations and output types (likert pros or cons).
 * Loads the prompt from the promptText variable of the yaml and ignores the rest of the yaml.
 * Directory structure: core/prompts/operation/outputType/prompt.yaml
 */
export class PromptRegistry {
  private promptsDir = path.join(__dirname);
  private registry: Map<string, CondensationPrompt> = new Map();

  /**
   * Static factory method to create and initialize a PromptRegistry
   */
  static async create(): Promise<PromptRegistry> {
    const registry = new PromptRegistry();
    await registry.loadPrompts();
    return registry;
  }

  /**
   * Recursively find all YAML files under a directory
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
   */
  async loadPrompts(): Promise<void> {
    console.info('🔍 Loading prompts from registry...');
    console.info('Prompts directory: ', this.promptsDir);
    const operations = await fs.readdir(this.promptsDir);
    console.info('Found operations: ', operations);

    for (const operation of operations) {
      const operationDir = path.join(this.promptsDir, operation);
      console.info(`🔍 Loading operations from: ${operationDir}`);
      const operationStat = await fs.stat(operationDir).catch(() => null);
      if (!operationStat || !operationStat.isDirectory()) continue;

      // Validate that this is a valid operation
      if (!Object.values(CondensationOperations).includes(operation as CondensationOperation)) {
        console.warn(`PROMPT REGISTRY: Skipping invalid operation directory: ${operation}`);
        continue;
      }

      const outputTypes = await fs.readdir(operationDir);
      for (const outputType of outputTypes) {
        const outputTypeDir = path.join(operationDir, outputType);
        const outputTypeStat = await fs.stat(outputTypeDir).catch(() => null);
        if (!outputTypeStat || !outputTypeStat.isDirectory()) continue;

        // Validate that this is a valid output type
        if (
          !Object.values(CONDENSATION_TYPE.LIKERT).includes(
            outputType as typeof CONDENSATION_TYPE.LIKERT.PROS | typeof CONDENSATION_TYPE.LIKERT.CONS
          )
        ) {
          console.warn(`PROMPT REGISTRY: Skipping invalid output type directory: ${outputType}`);
          continue;
        }

        const yamlFiles = await this.findYamlFiles(outputTypeDir);
        for (const yamlFile of yamlFiles) {
          try {
            const content = await fs.readFile(yamlFile, 'utf-8');
            const promptData = yaml.load(content) as {
              promptId: string;
              promptText: string;
              params?: Record<string, unknown>;
            };

            const prompt: CondensationPrompt = {
              promptId: promptData.promptId,
              promptText: promptData.promptText,
              operation: operation as CondensationOperation,
              condensationGoal: outputType as
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

    console.info(`✅ Loaded ${this.registry.size} prompts from registry`);
  }

  /**
   * Get a prompt by ID
   */
  getPrompt(promptId: string): CondensationPrompt | undefined {
    return this.registry.get(promptId);
  }

  /**
   * List all available prompts
   */
  listPrompts(): Array<{ promptId: string; operation: string; outputType: string }> {
    return Array.from(this.registry.values()).map((p) => ({
      promptId: p.promptId,
      operation: p.operation,
      outputType: p.condensationGoal
    }));
  }
}
