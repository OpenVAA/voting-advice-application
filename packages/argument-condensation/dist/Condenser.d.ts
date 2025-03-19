import { LLMProvider } from '@openvaa/llm';
import { Argument } from './types/Argument';
import { LanguageConfig } from './languageOptions/LanguageConfig';
import { CondensationType } from './types/CondensationType';
/**
 * Core class for condensing multiple comments into distinct arguments.
 * Processes comments in batches and maintains context between batches.
 */
export declare class Condenser {
    private llmProvider;
    private parser;
    private existingArguments;
    private languageConfig;
    private readonly MAP_PROMPT_TEMPLATE;
    private readonly RECURSIVE_PROMPT_TEMPLATE;
    private readonly MAX_PROMPT_LENGTH;
    /**
     * Creates a new Condenser instance
     * @param llmProvider - Provider for language model interactions
     * @param languageConfig - Language-specific configuration for prompts
     * @throws {ArgumentCondensationError} If required parameters are missing
     */
    constructor(llmProvider: LLMProvider, languageConfig: LanguageConfig);
    /**
     * Processes an array of comments to extract distinct Arguments sequentially
     * @param comments - Array of text comments to process
     * @param topic - The topic these comments relate to
     * @param batchSize - Number of comments to process in each batch (default: 30)
     * @returns Promise<Argument[]> Array of condensed Arguments
     * @throws {ArgumentCondensationError} If input validation fails
     * @throws {LLMError} If language model processing fails
     */
    processComments(comments: string[], topic: string, batchSize?: number, condensationType?: CondensationType, batchesPerArray?: number): Promise<Argument[]>;
    /**
     * Performs the first level of condensation by creating Argument arrays from comments
     * @param comments - Array of comments to process
     * @param topic - The topic these comments relate to
     * @param batchSize - Size of each batch
     * @param condensationType - Type of condensation (supporting, opposing, etc.)
     * @param batchesPerArray - Number of batches to use for one Argument array
     * @returns Promise<Argument[][]> - Array of Argument arrays
     * @private
     */
    private createArgumentArrays;
    /**
     * Processes a single batch of comments using previous Arguments as context
     * @param commentBatch - Array of comments to process in this batch
     * @param existingArgs - Previously extracted Arguments to use as context
     * @param topic - The topic these comments relate to
     * @param batchSize - Size of the current batch
     * @param nIteration - Current batch iteration number
     * @returns Promise<Argument[]> New Arguments extracted from this batch
     * @private
     */
    private processCommentBatch;
    /**
     * Condenses an array of Arguments into a smaller array of Arguments
     * @param argumentArray - Array of Arguments to condense
     * @param topic - The topic these Arguments relate to
     * @param condensationType - Type of condensation (supporting, opposing, etc.)
     * @returns Promise<Argument[]> Final condensed Argument
     * @private
     */
    private condenseArgumentArray;
    /**
     * Recursively condenses an array of Argument arrays until only one array remains
     * @param argumentArrays - Array of Argument arrays to condense
     * @param topic - The topic these Arguments relate to
     * @returns Promise<Argument[]> Final condensed Arguments
     * @private
     */
    private reduceArgumentArrays;
}
