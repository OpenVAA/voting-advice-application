/**
 * Load a prompt template from YAML file
 */
export declare function loadPrompt(promptFileName: string, language: string): Promise<{
    systemPrompt: string;
    userPrompt: string;
    defaultExamples: string;
}>;
//# sourceMappingURL=promptLoader.d.ts.map