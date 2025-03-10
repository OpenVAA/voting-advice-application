import { LLMProvider } from '@openvaa/llm';
import { Argument } from './types/Argument';
import { LanguageConfig } from './types/LanguageConfig';
/**
 * Core class for condensing multiple comments into distinct arguments.
 * Processes comments in batches and maintains context between batches.
 */
export declare class Condenser {
    private llmProvider;
    private parser;
    private existingArguments;
    private config;
    private readonly PROMPT_TEMPLATE;
    private readonly MAX_COMMENT_LENGTH;
    private readonly MAX_TOPIC_LENGTH;
    private readonly MAX_BATCH_SIZE;
    private readonly MAX_PROMPT_LENGTH;
    /**
     * Creates a new Condenser instance
     * @param llmProvider - Provider for language model interactions
     * @param config - Language-specific configuration for prompts and formatting
     * @throws {ArgumentCondensationError} If required parameters are missing
     */
    constructor(llmProvider: LLMProvider, config: LanguageConfig);
    /**
     * Processes an array of comments to extract distinct arguments sequentially
     * @param comments - Array of text comments to process
     * @param topic - The topic these comments relate to
     * @param batchSize - Number of comments to process in each batch (default: 30)
     * @returns Promise<Argument[]> Array of condensed arguments
     * @throws {ArgumentCondensationError} If input validation fails
     * @throws {LLMError} If language model processing fails
     */
    processComments(comments: string[], topic: string, batchSize?: number): Promise<Argument[]>;
    /**
     * Processes a single batch of comments, using previous arguments as context
     * @param batch - Array of comments to process in this batch
     * @param existingArgs - Previously extracted arguments to use as context
     * @param topic - The topic these comments relate to
     * @param batchSize - Size of the current batch
     * @param nIteration - Current batch iteration number
     * @returns Promise<Argument[]> New arguments extracted from this batch
     * @private
     */
    private _processBatch;
}
