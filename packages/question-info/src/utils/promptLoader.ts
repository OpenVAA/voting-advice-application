import { extractPromptVars, setPromptVars, validatePromptVars } from '@openvaa/llm';
import { readFile } from 'fs/promises';
import { load as loadYaml } from 'js-yaml';
import { load as loadYaml } from 'js-yaml';
import { join } from 'path';
import { FILENAMES_FOR_EXAMPLES } from '../consts';
import type { Controller } from '@openvaa/core';
import type { LoadedExampleYaml, LoadedPrompt, LoadedPromptYaml } from '../types';

/**
 * Load a generate-*.yaml prompt file for a given language
 *
 * @param promptFileName - Name of the prompt file (without .yaml extension)
 * @param language - Language code (e.g., 'en')
 * @param controller - Optional controller for validation warnings
 * @returns Loaded prompt with template and metadata
 *
 * @example
 * ```ts
 * const prompt = await loadPrompt({
 *   promptFileName: 'generateTerms',
 *   language: 'en'
 * });
 * console.log(prompt.prompt); // The prompt template string
 * console.log(prompt.usedVars); // Variables used in the template
 * ```
 */
export async function loadPrompt({
  promptFileName,
  language
}: {
  promptFileName: string;
  language: string;
  controller?: Controller;
}): Promise<LoadedPrompt> {
  const filePath = join(process.cwd(), 'src', 'prompts', language, `${promptFileName}.yaml`);
  const raw = await readFile(filePath, 'utf-8');
  const parsed = loadYaml(raw) as LoadedPromptYaml;

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Invalid YAML for prompt ${promptFileName} (${language})`);
  }
  if (!parsed.prompt) {
    throw new Error(`Prompt ${promptFileName} (${language}) must contain 'prompt' field`);
  }

  // Extract variables from the single prompt field
  const usedVars = extractPromptVars(parsed.prompt);

  // Validate against documented params (if present)
  validatePromptVars({
    promptText: parsed.prompt,
    params: parsed.params
  });

  return {
    prompt: parsed.prompt,
    params: parsed.params,
    usedVars
  };
}

/**
 * Load instructions from instructions.yaml
 *
 * @param language - Language code (e.g., 'en')
 * @returns Object containing instruction strings for different generation aspects
 *
 * @example
 * ```ts
 * const instructions = await loadInstructions({ language: 'en' });
 * console.log(instructions.generalInstructions);
 * console.log(instructions.neutralityRequirements);
 * ```
 */
export async function loadInstructions({ language }: { language: string }): Promise<Record<string, string>> {
  const filePath = join(process.cwd(), 'src', 'prompts', language, 'instructions.yaml');
  const raw = await readFile(filePath, 'utf-8');
  return loadYaml(raw) as Record<string, string>;
}

/**
 * Load all examples from the FILENAMES_FOR_EXAMPLES array
 *
 * @param params - Parameters object
 * @param params.language - Language code (e.g., 'en')
 * @returns Array of example objects with question and expected outputs
 *
 * @example
 * ```ts
 * const examples = await loadAllExamples({ language: 'en' });
 * examples.forEach(example => {
 *   console.log(example.question);
 *   console.log(example.termExample);
 *   console.log(example.infoSectionExample);
 * });
 * ```
 */
export async function loadAllExamples({ language }: { language: string }): Promise<
  Array<{
    question: string;
    termExample: string;
    infoSectionExample: string;
  }>
> {
  const examples: Array<{
    question: string;
    termExample: string;
    infoSectionExample: string;
  }> = [];

  for (const filename of FILENAMES_FOR_EXAMPLES) {
    const filePath = join(process.cwd(), 'src', 'prompts', language, 'examples', `${filename}.yaml`);
    const raw = await readFile(filePath, 'utf-8');
    const exampleData = loadYaml(raw) as LoadedExampleYaml;

    examples.push({
      question: exampleData.question || '',
      termExample: exampleData.termExample || '',
      infoSectionExample: exampleData.infoSectionExample || ''
    });
  }

  return examples;
}

/**
 * Helper wrapper requested by product:
 * Embeds variables into prompt text with non-strict behavior and controller warnings on missing vars.
 */
export function embedPromptVars({
  promptText,
  variables,
  controller
}: {
  promptText: string;
  variables: Record<string, unknown>;
  controller?: Controller;
}): string {
  return setPromptVars({
    promptText,
    variables,
    strict: false,
    controller
  });
}
