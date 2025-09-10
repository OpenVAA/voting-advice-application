import { BaseController } from '@openvaa/core';
import { setPromptVars } from '@openvaa/llm';
import { readFile } from 'fs/promises';
import { load as loadYaml } from 'js-yaml';
import { join } from 'path';
import type { Controller } from '@openvaa/core';

/**
 * Minimal shape of a generate-*.yaml prompt
 * Validation is done against the prompt variables declared in the prompt file, so they should be up-to-date.
 */
export interface LoadedPromptYaml {
  systemPrompt: string;
  userPrompt: string;
  params?: Record<string, unknown>;
  // allow dev notes and any other fields
  [key: string]: unknown;
}

/**
 * Result of loading a prompt with extracted variable metadata
 */
export interface LoadedPrompt {
  systemPrompt: string;
  userPrompt: string;
  params?: Record<string, unknown>;
  usedVars: {
    inSystem: Array<string>;
    inUser: Array<string>;
    union: Array<string>;
  };
}

/**
 * Extract {{variable}} placeholders from prompt text.
 */
export function extractVariablesFromPromptText(promptText: string): Array<string> {
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const vars = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = placeholderRegex.exec(promptText)) !== null) {
    vars.add(m[1]);
  }
  return Array.from(vars);
}

/**
 * Validate variables used in prompt text against the documented params in YAML.
 * Warns via controller on mismatch; does not throw.
 */
export function validatePromptVariableDocs({
  systemPrompt,
  userPrompt,
  params,
  controller = new BaseController()
}: {
  systemPrompt: string;
  userPrompt: string;
  params?: Record<string, unknown>;
  controller?: Controller;
}): void {
  const inSystem = extractVariablesFromPromptText(systemPrompt);
  const inUser = extractVariablesFromPromptText(userPrompt);
  const used = Array.from(new Set([...inSystem, ...inUser]));
  const documented = params ? Object.keys(params) : [];

  const undocumented = used.filter((v) => !documented.includes(v));
  const extra = documented.filter((v) => !used.includes(v));

  if (undocumented.length > 0) {
    controller.warning(`[promptLoader] Undocumented variables used in prompt: ${undocumented.join(', ')}`);
  }
  if (extra.length > 0) {
    controller.warning(
      `[promptLoader] Variables documented in params but not used in prompt text: ${extra.join(', ')}`
    );
  }
}

/**
 * Load a generate-*.yaml prompt file for a given language.
 * Validates variable usage vs the prompt's declared "params" and returns the prompt with metadata.
 */
export async function loadPrompt({
  promptFileName,
  language,
  controller = new BaseController()
}: {
  promptFileName: string; // e.g. "generateTerms", "generateInfoSections", "generateBoth"
  language: string; // e.g. "en"
  controller?: Controller;
}): Promise<LoadedPrompt> {
  const filePath = join(process.cwd(), 'src', 'prompts', language, `${promptFileName}.yaml`);
  const raw = await readFile(filePath, 'utf-8');
  const parsed = loadYaml(raw) as LoadedPromptYaml;

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Invalid YAML for prompt ${promptFileName} (${language})`);
  }
  if (!parsed.systemPrompt || !parsed.userPrompt) {
    throw new Error(`Prompt ${promptFileName} (${language}) must contain 'systemPrompt' and 'userPrompt'`);
  }

  // Extract variables
  const inSystem = extractVariablesFromPromptText(parsed.systemPrompt);
  const inUser = extractVariablesFromPromptText(parsed.userPrompt);
  const union = Array.from(new Set([...inSystem, ...inUser]));

  // Validate against documented params (if present)
  validatePromptVariableDocs({
    systemPrompt: parsed.systemPrompt,
    userPrompt: parsed.userPrompt,
    params: parsed.params,
    controller
  });

  return {
    systemPrompt: parsed.systemPrompt,
    userPrompt: parsed.userPrompt,
    params: parsed.params,
    usedVars: { inSystem, inUser, union }
  };
}

/**
 * Helper wrapper requested by product:
 * Embeds variables into prompt text with non-strict behavior and controller warnings on missing vars.
 */
export function embedPromptVars({
  promptText,
  variables,
  controller = new BaseController()
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

/**
 * Convenience: embed variables into system and user prompts in one go.
 * Returns rendered strings while leaving unprovided vars as {{placeholders}} with warnings.
 */
export function renderPromptWithVars({
  prompt,
  variables,
  controller = new BaseController()
}: {
  prompt: LoadedPrompt;
  variables: Record<string, unknown>;
  controller?: Controller;
}): { system: string; user: string } {
  const system = embedPromptVars({ promptText: prompt.systemPrompt, variables, controller });
  const user = embedPromptVars({ promptText: prompt.userPrompt, variables, controller });
  return { system, user };
}
