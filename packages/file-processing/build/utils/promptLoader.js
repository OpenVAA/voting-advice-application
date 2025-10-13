import { extractPromptVars, validatePromptVars } from '@openvaa/llm-refactor';
import { readFile } from 'fs/promises';
import { load as loadYaml } from 'js-yaml';
import { join } from 'path';
/**
 * Load a YAML prompt file
 *
 * @param promptFileName - Name of the prompt file (without .yaml extension)
 * @returns Loaded prompt with template and metadata
 */
export async function loadPrompt({ promptFileName }) {
    const filePath = join(`${process.platform === 'win32' ? '' : '/'}${/file:\/{2,3}(.+)\/[^/]/.exec(import.meta.url)[1]}`, '..', 'prompts', `${promptFileName}.yaml`);
    const raw = await readFile(filePath, 'utf-8');
    const parsed = loadYaml(raw);
    if (!parsed || typeof parsed !== 'object') {
        throw new Error(`Invalid YAML for prompt ${promptFileName}`);
    }
    if (!parsed.prompt) {
        throw new Error(`Prompt ${promptFileName} must contain 'prompt' field`);
    }
    const usedVars = extractPromptVars(parsed.prompt);
    validatePromptVars({
        promptText: parsed.prompt,
        params: parsed.params
    });
    return {
        id: parsed.id,
        prompt: parsed.prompt,
        params: parsed.params,
        usedVars
    };
}
