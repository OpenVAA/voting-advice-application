import { LLMResponse } from './types';
interface LLMProviderConfig {
    apiKey: string;
    model: string;
}
export declare class LLMProvider {
    private apiKey;
    private model;
    constructor(config: LLMProviderConfig);
    generate(prompt: string): Promise<LLMResponse>;
}
export {};
