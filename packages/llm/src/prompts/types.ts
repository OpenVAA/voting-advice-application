import type { Controller } from '@openvaa/core';

/**
 * Internal representation of a loaded prompt from a YAML file
 */
export interface PromptData {
  /** Unique identifier for the prompt (from YAML) */
  promptId: string;
  /** The prompt template text with {{variable}} placeholders */
  prompt: string;
  /** Language of this prompt file (detected from file path) */
  language: string;
  /** Absolute file path (for debugging) */
  filePath: string;
  /** List of required parameter names that must be provided */
  requiredParams: Array<string>;
  /** List of optional parameter names that can be provided */
  optionalParams: Array<string>;
}

/**
 * Metadata about how a prompt was resolved and composed
 */
export interface PromptMetadata {
  /** The prompt ID that was requested */
  promptId: string;
  /** Language of the prompt file that was actually used */
  promptLanguage: string;
  /** The output language that was requested */
  outputLanguage: string;
  /** Whether we fell back to English because requested language wasn't available */
  usedFallback: boolean;
  /** Whether localization instructions were injected */
  usedLocalizationInstructions: boolean;
}

/**
 * Options for loading and composing a prompt
 */
export interface LoadPromptOptions {
  /** Unique identifier of the prompt to load */
  promptId: string;
  /** Output language for the LLM response) */
  language: string;
  /** Variables to embed in the prompt template */
  variables: Record<string, unknown>;
  /** Fallback to localization instruction if the prompt is not available in the requested language.
   * Not recommended. It's better to use the prompt in the requested language. For simple tasks, this
   * may be useful. For complex and/or often-used tasks, please create a new prompt in your language.
   */
  fallbackLocalization?: boolean;
  /** Whether to throw an error if required variables are missing (default: true) */
  throwIfVarsMissing?: boolean;
}

/**
 * Result of loading and composing a prompt
 */
export interface LoadPromptResult {
  /** The fully composed prompt text, ready to send to the LLM */
  promptText: string;
  /** Metadata about how the prompt was resolved */
  metadata: PromptMetadata;
}

/**
 * Options for registering prompts from a package
 */
export interface RegisterPromptsOptions {
  /** Name of the package registering prompts (for logging and debugging) */
  packageName: string;
  /** Absolute path to the package's prompts directory */
  promptsDir: string;
  /** Optional controller for warnings during prompt loading */
  controller?: Controller;
}

/**
 * Raw structure of a prompt YAML file
 */
export interface PromptYaml {
  promptId: string;
  promptText: string;
  params?: {
    required?: Array<string>;
    optional?: Array<string>;
  };
  language?: string;
}
