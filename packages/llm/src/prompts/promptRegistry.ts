import { BaseController } from '@openvaa/core';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { LOCALIZATION_INSTRUCTIONS, type PromptLanguage, SUPPORTED_PROMPT_LANGUAGES } from './localizationInstructions';
import { setPromptVars, validatePromptVars } from '../utils';
import type { Controller } from '@openvaa/core';
import type {
  LoadPromptOptions,
  LoadPromptResult,
  PromptData,
  PromptMetadata,
  PromptYaml,
  RegisterPromptsOptions
} from './types';

/**
 * Global registry for managing prompts across all LLM features.
 *
 * Features register their prompts at package module initialization time using `registerPrompts()`.
 * This allows packages to specify where their prompts are located, as it features will have differing prompt directory structures.
 * Prompts are then loaded by callers using `loadPrompt()`. This function is rapid, as yaml parsing and I/O operations are cached.
 *
 * @example
 * // In feature's prompts.ts:
 * registerPrompts({
 *   packageName: 'my-feature',
 *   promptsDir: path.join(__dirname, 'prompts')
 * });
 *
 * // Anywhere in the feature code:
 * const { promptText } = await loadPrompt({
 *   promptId: 'my_prompt_id',
 *   language: 'fi',
 *   variables: { topic: 'Test' }
 * });
 */
class GlobalPromptRegistry {
  /**
   * Global index of all registered prompts
   * Structure: Map<promptId, Map<language, PromptData>>
   */
  private static promptIndex = new Map<string, Map<string, PromptData>>();

  /**
   * Track which packages have been initialized to prevent double-registration
   */
  private static initialized = new Set<string>();

  /**
   * Register prompts from a feature's prompts directory
   *
   * This function:
   * 1. Recursively scans the directory for .yaml files
   * 2. Detects the language from the file path
   * 3. Parses and validates each YAML file
   * 4. Adds prompts to the global index
   *
   * @param options - Registration options including package name and prompts directory
   */
  static async registerPrompts(options: RegisterPromptsOptions): Promise<void> {
    const { packageName, promptsDir, controller = new BaseController() } = options;

    // Prevent double registration
    if (this.initialized.has(packageName)) {
      controller.warning(`[PromptRegistry] Package '${packageName}' already registered, skipping.`);
      return;
    }

    // Check if directory exists
    try {
      await fs.access(promptsDir);
    } catch {
      throw new Error(`[PromptRegistry] Prompts directory not found: ${promptsDir}`);
    }

    // Scan directory for YAML files
    const prompts = await this.scanDirectory(promptsDir, controller);

    // Add each prompt to the global index
    for (const promptData of prompts) {
      // Get or create language map for this prompt ID
      if (!this.promptIndex.has(promptData.promptId)) {
        this.promptIndex.set(promptData.promptId, new Map());
      }

      const languageMap = this.promptIndex.get(promptData.promptId)!;

      // Check for duplicate prompt ID + language combination
      if (languageMap.has(promptData.language)) {
        controller.warning(
          `[PromptRegistry] Duplicate prompt: ${promptData.promptId} (${promptData.language}) from ${packageName}. Overwriting previous.`
        );
      }

      languageMap.set(promptData.language, promptData);
    }

    this.initialized.add(packageName);
    controller.info(`[PromptRegistry] Registered ${prompts.length} prompts from '${packageName}'`);
  }

  /**
   * Recursively scan a directory for .yaml files and parse them into PromptData
   */
  private static async scanDirectory(dir: string, controller: Controller): Promise<Array<PromptData>> {
    const results: Array<PromptData> = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subPrompts = await this.scanDirectory(fullPath, controller);
          results.push(...subPrompts);
        } else if (entry.isFile() && entry.name.endsWith('.yaml')) {
          // Parse YAML file
          try {
            const promptData = await this.parseYamlFile(fullPath, controller);
            if (promptData) {
              results.push(promptData);
            }
          } catch (error) {
            controller.warning(
              `[PromptRegistry] Failed to parse ${fullPath}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
      }
    } catch (error) {
      controller.warning(
        `[PromptRegistry] Error scanning directory ${dir}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return results;
  }

  /**
   * Parse a YAML file into PromptData
   */
  private static async parseYamlFile(filePath: string, controller: Controller): Promise<PromptData | null> {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = yaml.load(content) as PromptYaml;

    // Validate required fields
    if (!parsed || typeof parsed !== 'object') {
      controller.warning(`[PromptRegistry] Invalid YAML structure in ${filePath}`);
      return null;
    }

    if (!parsed.promptId) {
      controller.warning(`[PromptRegistry] Missing promptId in ${filePath}`);
      return null;
    }

    if (!parsed.promptText) {
      controller.warning(`[PromptRegistry] Missing promptText in ${filePath}`);
      return null;
    }

    // Extract required and optional params
    const requiredParams = parsed.params?.required ?? [];
    const optionalParams = parsed.params?.optional ?? [];

    // Validate that all variables in promptText are documented
    const validation = validatePromptVars({
      promptText: parsed.promptText,
      params: {
        ...Object.fromEntries(requiredParams.map((p) => [p, 'required'])),
        ...Object.fromEntries(optionalParams.map((p) => [p, 'optional']))
      }
    });

    if (!validation.valid) {
      const errorDetails = [];
      if (validation.undocumented.length > 0) {
        errorDetails.push(
          `undocumented variables: ${validation.undocumented.join(', ')} (found in promptText but not in params)`
        );
      }
      if (validation.extra.length > 0) {
        errorDetails.push(
          `unused documented variables: ${validation.extra.join(', ')} (declared in params but not in promptText)`
        );
      }

      controller.warning(`[PromptRegistry] Variable validation failed for ${filePath}: ${errorDetails.join('; ')}`);
    }

    // Detect language from file path if not specified in the yaml
    const language = parsed.language ?? this.detectLanguage(filePath);

    return {
      promptId: parsed.promptId,
      prompt: parsed.promptText,
      language,
      filePath,
      requiredParams,
      optionalParams
    };
  }

  /**
   * Detect language from file path by looking for language codes in path segments
   *
   * Examples:
   * - /prompts/en/MAP/likertPros/prompt.yaml → 'en'
   * - /prompts/fi/generateTerms.yaml → 'fi'
   * - /some/path/sv/nested/prompt.yaml → 'sv'
   */
  private static detectLanguage(filePath: string): string {
    const segments = filePath.split(path.sep);

    // Look for known language codes in path segments
    for (const segment of segments) {
      if (SUPPORTED_PROMPT_LANGUAGES.includes(segment as PromptLanguage)) {
        return segment;
      }
    }

    // Default to English if no language detected
    return 'en';
  }

  /**
   * Get prompt data for a specific prompt ID and language
   */
  static getPromptData(promptId: string, language: string): PromptData | undefined {
    const languageMap = this.promptIndex.get(promptId);
    return languageMap?.get(language);
  }

  /**
   * Get all available languages for a prompt ID
   */
  static getAvailableLanguages(promptId: string): Array<string> {
    const languageMap = this.promptIndex.get(promptId);
    return languageMap ? Array.from(languageMap.keys()) : [];
  }

  /**
   * Check if a prompt exists
   */
  static hasPrompt(promptId: string): boolean {
    return this.promptIndex.has(promptId);
  }

  /**
   * Get all registered prompt IDs
   */
  static getAllPromptIds(): Array<string> {
    return Array.from(this.promptIndex.keys());
  }

  /**
   * Clear the registry (mainly for testing)
   */
  static clear(): void {
    this.promptIndex.clear();
    this.initialized.clear();
  }
}

/**
 * Register prompts from a feature's prompts directory
 *
 * This should be called once per feature, typically in a dedicated prompts.ts file
 * that is imported at the top of the feature's index.ts.
 *
 * @example
 * // In packages/my-feature/src/prompts.ts:
 * import { registerPrompts } from '@openvaa/llm';
 * import * as path from 'path';
 *
 * registerPrompts({
 *   packageName: 'my-feature',
 *   promptsDir: path.join(__dirname, 'prompts')
 * }).catch(err => {
 *   console.error('[my-feature] Failed to register prompts:', err);
 * });
 */
export async function registerPrompts(options: RegisterPromptsOptions): Promise<void> {
  return GlobalPromptRegistry.registerPrompts(options);
}

/**
 * Load and compose a prompt with variable substitution
 *
 * This function:
 * 1. Looks up the prompt by ID
 * 2. Tries to find it in the requested language
 * 3. Falls back to English if not found
 * 4. Auto-injects localizationInstructions if falling back
 * 5. Validates and embeds variables
 * 6. Returns the composed prompt with metadata
 *
 * @param options - Options including prompt ID, language, and variables
 * @returns The composed prompt text and metadata about how it was resolved
 *
 * @example
 * const { promptText, metadata } = await loadPrompt({
 *   promptId: 'map_likertPros_condensation_v1',
 *   language: 'fi',
 *   variables: { topic: 'Healthcare', comments: '...' },
 *   strict: true
 * });
 *
 * if (metadata.usedFallback) {
 *   console.log(`Used ${metadata.promptLanguage} prompt for ${metadata.outputLanguage} output`);
 * }
 */
export async function loadPrompt(options: LoadPromptOptions): Promise<LoadPromptResult> {
  const { promptId, language, variables, throwIfVarsMissing: strict = true, fallbackLocalization = false } = options;

  // Check if prompt exists
  if (!GlobalPromptRegistry.hasPrompt(promptId)) {
    const availablePrompts = GlobalPromptRegistry.getAllPromptIds();
    throw new Error(
      `[PromptRegistry] Prompt '${promptId}' not found. Available prompts: ${availablePrompts.join(', ')}`
    );
  }

  // Try to get prompt in requested language
  let promptData = GlobalPromptRegistry.getPromptData(promptId, language);
  let usedFallback = false;

  // Handle missing prompt
  if (!promptData) {
    if (fallbackLocalization) {
      promptData = GlobalPromptRegistry.getPromptData(promptId, 'en');
      usedFallback = true;

      if (!promptData) {
        const availableLanguages = GlobalPromptRegistry.getAvailableLanguages(promptId);
        throw new Error(
          `[PromptRegistry] Fallback localization failed for prompt '${promptId}'. Prompt is available in these languages: ${availableLanguages.join(', ')}`
        );
      }
    } else {
      throw new Error(
        `[PromptRegistry] Prompt '${promptId}' not found in language '${language}' and fallbackLocalization is false. Setting fallbackLocalization as false indicates that the developer of this prompt has deemed this task too complex to be reliably localized without a new prompt in the native language of the task. Either create a new native prompt or experiment with fallback localization.`
      );
    }
  }

  // Validate required parameters
  const missingRequired = promptData.requiredParams.filter((param) => !(param in variables));
  if (missingRequired.length > 0) {
    if (strict) {
      throw new Error(
        `[PromptRegistry] Missing required parameters for prompt '${promptId}': ${missingRequired.join(', ')}`
      );
    }
  }

  // Prepare final variables with auto-injection of localizationInstructions
  const finalVariables = { ...variables };
  let usedLocalizationInstructions = false;

  if (usedFallback && promptData.optionalParams.includes('localizationInstructions') && language !== 'en') {
    const instruction = LOCALIZATION_INSTRUCTIONS[language];
    if (instruction) {
      finalVariables.localizationInstructions = instruction;
      usedLocalizationInstructions = true;
    }
  }

  // Embed variables into prompt text
  const promptText = setPromptVars({
    promptText: promptData.prompt,
    variables: finalVariables,
    strict,
    controller: new BaseController(),
    optional: promptData.optionalParams
  });

  // Build metadata
  const metadata: PromptMetadata = {
    promptId,
    promptLanguage: promptData.language,
    outputLanguage: language,
    usedFallback,
    usedLocalizationInstructions
  };

  return {
    promptText,
    metadata
  };
}

// Export for testing
export { GlobalPromptRegistry };
