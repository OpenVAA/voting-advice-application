"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMProvider = void 0;
class LLMProvider {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.model = config.model;
    }
    async generate(prompt) {
        // TODO: Implement actual OpenAI API call
        // This is a placeholder implementation
        return {
            content: '',
            usage: {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
            },
            model: this.model,
        };
    }
}
exports.LLMProvider = LLMProvider;
