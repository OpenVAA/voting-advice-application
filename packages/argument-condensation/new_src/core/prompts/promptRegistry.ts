import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CondensationPrompt } from '../types/prompt';
import { CondensationOperations } from '../types/condensation/operation';
import { CONDENSATION_TYPE } from '../types/condensationType';

/**
 * Manages condensation prompts organized by operations and output types.
 * Directory structure: prompts/operation/outputType/prompt.yaml
 */
export class PromptRegistry {
  private promptsDir = path.join(__dirname);
  private registry: Map<string, CondensationPrompt> = new Map();

  /**
   * Recursively find all YAML files under a directory
   */
  private async findYamlFiles(dir: string): Promise<string[]> {
    let results: string[] = [];
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
    } catch (e) {
      // Directory may not exist, skip
    }
    return results;
  }

  /**
   * Load all prompts from the registry.
   * Expected directory structure:
   * prompts/
   * ├── REFINE/
   * │   ├── likertPros/
   * │   │   ├── initialBatchPrompt.yaml
   * │   │   └── refinementPrompt.yaml
   * │   └── likertCons/
   * │       ├── initialBatchPrompt.yaml
   * │       └── refinementPrompt.yaml
   * ├── MAP/
   * │   ├── likertPros/
   * │   │   └── condensationPrompt.yaml
   * │   └── likertCons/
   * │       └── condensationPrompt.yaml
   * ├── REDUCE/
   * │   ├── likertPros/
   * │   │   └── coalescingPrompt.yaml
   * │   └── likertCons/
   * │       └── coalescingPrompt.yaml
   * └── GROUND/
   *     ├── likertPros/
   *     │   └── groundingPrompt.yaml
   *     └── likertCons/
   *         └── groundingPrompt.yaml
   */
  async loadPrompts(): Promise<void> {
    const operations = await fs.readdir(this.promptsDir);
    
    for (const operation of operations) {
      const operationDir = path.join(this.promptsDir, operation);
      const operationStat = await fs.stat(operationDir).catch(() => null);
      if (!operationStat || !operationStat.isDirectory()) continue;
      
      // Validate that this is a valid operation
      if (!Object.values(CondensationOperations).includes(operation as CondensationOperations)) {
        console.warn(`Skipping invalid operation directory: ${operation}`);
        continue;
      }
      
      const outputTypes = await fs.readdir(operationDir);
      for (const outputType of outputTypes) {
        const outputTypeDir = path.join(operationDir, outputType);
        const outputTypeStat = await fs.stat(outputTypeDir).catch(() => null);
        if (!outputTypeStat || !outputTypeStat.isDirectory()) continue;
        
        // Validate that this is a valid output type
        if (!Object.values(CONDENSATION_TYPE.LIKERT).includes(outputType as any)) {
          console.warn(`Skipping invalid output type directory: ${outputType}`);
          continue;
        }
        
        const yamlFiles = await this.findYamlFiles(outputTypeDir);
        for (const yamlFile of yamlFiles) {
          try {
            const content = await fs.readFile(yamlFile, 'utf-8');
            const promptData = yaml.load(content) as any;
            
            const prompt: CondensationPrompt = {
              promptId: promptData.promptId,
              promptText: promptData.promptText,
              operation: operation as CondensationOperations,
              condensationGoal: outputType as any,
              params: promptData.params || {}
            };
            
            this.registry.set(prompt.promptId, prompt);
            console.log(`Loaded prompt: ${prompt.promptId} (${operation}/${outputType})`);
          } catch (error) {
            console.error(`Failed to load prompt from ${yamlFile}:`, error);
          }
        }
      }
    }
  }

  /**
   * Get a prompt by ID
   */
  getPrompt(promptId: string): CondensationPrompt | undefined {
    return this.registry.get(promptId);
  }

  /**
   * Get all prompts for a specific operation
   */
  getPromptsByOperation(operation: CondensationOperations): CondensationPrompt[] {
    return Array.from(this.registry.values()).filter(p => p.operation === operation);
  }

  /**
   * Get all prompts for a specific operation and output type
   */
  getPromptsByOperationAndType(operation: CondensationOperations, outputType: string): CondensationPrompt[] {
    return Array.from(this.registry.values()).filter(p => 
      p.operation === operation && p.condensationGoal === outputType
    );
  }

  /**
   * Get the latest version of a prompt by base ID (without version)
   */
  getLatestPrompt(baseId: string): CondensationPrompt | undefined {
    const matchingPrompts = Array.from(this.registry.values())
      .filter(p => p.promptId.startsWith(baseId))
      .sort((a, b) => b.promptId.localeCompare(a.promptId));
    
    return matchingPrompts[0];
  }

  /**
   * Render a prompt template with variables
   */
  renderPrompt(promptId: string, variables: Record<string, any>): string {
    const prompt = this.getPrompt(promptId);
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    let renderedText = prompt.promptText;
    
    // Replace template variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      renderedText = renderedText.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return renderedText;
  }

  /**
   * List all available prompts
   */
  listPrompts(): { promptId: string; operation: string; outputType: string }[] {
    return Array.from(this.registry.values()).map(p => ({
      promptId: p.promptId,
      operation: p.operation,
      outputType: p.condensationGoal
    }));
  }

  /**
   * Get prompts organized by operation and output type
   */
  getPromptsByOperationAndTypeMap(): Record<string, Record<string, CondensationPrompt[]>> {
    const result: Record<string, Record<string, CondensationPrompt[]>> = {};
    
    for (const prompt of this.registry.values()) {
      if (!result[prompt.operation]) {
        result[prompt.operation] = {};
      }
      if (!result[prompt.operation][prompt.condensationGoal]) {
        result[prompt.operation][prompt.condensationGoal] = [];
      }
      result[prompt.operation][prompt.condensationGoal].push(prompt);
    }
    
    return result;
  }
} 