/**
 * Centralized prompt management system for all LLM features
 *
 * This module provides:
 * - Global prompt registry with auto-caching
 * - Language fallback with localization instructions
 * - Simple function API for loading prompts
 *
 * @example
 * // Register prompts (once per feature, in feature's prompts.ts):
 * import { registerPrompts, type PromptYaml } from '@openvaa/llm';
 * registerPrompts({
 *   packageName: 'my-feature',
 *   promptsDir: path.join(__dirname, 'prompts')
 * });
 *
 * // Load prompts (anywhere in feature code):
 * import { loadPrompt } from '@openvaa/llm';
 * const { promptText } = await loadPrompt({
 *   promptId: 'my_prompt',
 *   language: 'fi',
 *   variables: { topic: 'Test' }
 * });
 */

export * from './localizationInstructions';
export { loadPrompt, registerPrompts } from './promptRegistry';
export * from './types';
