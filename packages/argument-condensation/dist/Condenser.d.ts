import { LLMProvider } from '@openvaa/llm';
import { Argument } from './types/Argument';
export declare class Condenser {
    private llmProvider;
    private parser;
    private allArguments;
    private readonly PROMPT_TEMPLATE;
    constructor(llmProvider: LLMProvider);
    processComments(comments: string[], topic: string, nComments: number, batchSize?: number): Promise<Argument[]>;
    private _processBatch;
}
