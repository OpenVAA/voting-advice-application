/**
 * Structure of a loaded YAML prompt file
 */
export interface LoadedPromptYaml {
    id: string;
    params?: Record<string, string>;
    prompt: string;
}
/**
 * Processed prompt with extracted metadata
 */
export interface LoadedPrompt {
    id: string;
    prompt: string;
    params?: Record<string, string>;
    usedVars: Array<string>;
}
/**
 * Load a YAML prompt file
 *
 * @param promptFileName - Name of the prompt file (without .yaml extension)
 * @returns Loaded prompt with template and metadata
 */
export declare function loadPrompt({ promptFileName }: {
    promptFileName: string;
}): Promise<LoadedPrompt>;
//# sourceMappingURL=promptLoader.d.ts.map