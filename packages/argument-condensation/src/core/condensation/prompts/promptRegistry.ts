import { extractPromptVars, validatePromptVars } from '@openvaa/llm-refactor';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { CONDENSATION_TYPE, CondensationOperations } from '../../types';
import type { Controller } from '@openvaa/core';
import type { CondensationOperation, CondensationOutputType, CondensationPrompt } from '../../types';

// TODO: (low priority): load only the specific yamls we need (currently we load all yamls for a all operations and output types)
// TODO: (low priority): make it possible load a customized prompt variable (currently this is hardcoded to 'promptText'),
// so the yaml's other variables are unreachable - if someone wants to test out different prompts using the same yaml,
// this needs to be changed.

/**
 * Manages condensation prompts organized by operations and condensation types.
 * Loads the prompt from the 'promptText' variable of the yaml.
 * Directory structure: core/condensation/prompts/'language'/'operation'/'condensationType'/'promptType'.yaml
 *
 * @param controller - Optional controller for warning messages during prompt loading
 */
export class PromptRegistry {
  private promptsDir = path.join(__dirname);
  private registry: Map<string, CondensationPrompt> = new Map(); // The key is promptId!
  private controller?: Controller;

  constructor(controller?: Controller) {
    this.controller = controller;
  }

  /**
   * Static factory method to create and initialize a PromptRegistry
   *
   * @param language - The language to load prompts for
   * @param controller - Optional controller for warning messages during prompt loading
   * @returns A promise that resolves to a fully initialized PromptRegistry
   */
  static async create(language: string, controller?: Controller): Promise<PromptRegistry> {
    const registry = new PromptRegistry(controller);
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
      const operationStat = await fs.stat(operationDir).catch(() => null); // Ignore errors if the directory doesn't exist
      if (!operationStat || !operationStat.isDirectory()) continue; // Skip if not a directory

      // Make sure that the operation directory name is a valid operation (e.g. map, refine, etc.)
      if (!Object.values(CondensationOperations).includes(operation as CondensationOperation)) {
        this.controller?.warning(`PROMPT REGISTRY: Skipping invalid operation directory: ${operation}`);
        continue;
      }

      const outputTypes = await fs.readdir(operationDir);
      for (const outputType of outputTypes) {
        const outputTypeDir = path.join(operationDir, outputType);
        const outputTypeStat = await fs.stat(outputTypeDir).catch(() => null);
        if (!outputTypeStat || !outputTypeStat.isDirectory()) continue; // Skip if not a directory

        // Validate that the condensation type exists
        if (!Object.values(CONDENSATION_TYPE).includes(outputType as CondensationOutputType)) {
          this.controller?.warning(`PROMPT REGISTRY: Skipping invalid output type directory: ${outputType}`);
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

            // Validate variables before creating the prompt
            const validation = validatePromptVars(promptData.promptText, promptData.params);

            if (!validation.valid) {
              const errorDetails = [];
              if (validation.undocumented.length > 0) {
                errorDetails.push(
                  `undocumented variables (not in 'params' variable of the prompt yaml even though they are in 'promptText'): ${validation.undocumented.join(', ')}`
                );
              }
              if (validation.extra.length > 0) {
                errorDetails.push(
                  `unused documented variables (not found in 'promptText' variable even though set in yaml's 'params' variable): ${validation.extra.join(', ')}`
                );
              }

              this.controller?.warning(
                `PROMPT REGISTRY: Variable validation failed for prompt '${promptData.promptId}' in ${yamlFile}: ${errorDetails.join('; ')}. Skipping this prompt.`
              );

              // Skip adding this prompt to the registry due to validation failure
              continue;
            }

            // Create the prompt object and set it in the registry for later use
            const prompt: CondensationPrompt = {
              promptId: promptData.promptId,
              promptText: promptData.promptText,
              operation: operation as CondensationOperation,
              condensationType: outputType as CondensationOutputType,
              params: (promptData.params ?? {}) as unknown as CondensationPrompt['params']
            };

            if (this.registry.has(prompt.promptId)) {
              this.controller?.warning(
                `PROMPT REGISTRY: Duplicate promptId '${prompt.promptId}' found in ${yamlFile}. Overwriting.`
              );
            }
            this.registry.set(prompt.promptId, prompt);
          } catch (error) {
            this.controller?.warning(
              `PROMPT REGISTRY: Failed to load prompt from ${yamlFile}: ${error instanceof Error ? error.message : error}`
            );
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

  /**
   * Validate variables for a specific prompt at runtime
   *
   * @param promptId - The ID of the prompt to validate
   * @param variables - The variables provided for the prompt
   * @returns Validation result with details about any mismatches
   */
  validatePromptVariablesAtRuntime(
    promptId: string,
    variables: Record<string, unknown>
  ): {
    valid: boolean;
    missing: Array<string>;
    extra: Array<string>;
  } {
    const prompt = this.getPrompt(promptId);
    if (!prompt) {
      throw new Error(`Prompt with ID '${promptId}' not found`);
    }

    const variablesInText = extractPromptVars(prompt.promptText);
    const providedVars = Object.keys(variables);

    const missing = variablesInText.filter((v) => !providedVars.includes(v));
    const extra = providedVars.filter((v) => !variablesInText.includes(v));

    return {
      valid: missing.length === 0,
      missing,
      extra
    };
  }
}
