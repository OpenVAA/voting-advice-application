import { LanguageConfig } from '../types/LanguageConfig';
/**
 * Parser for extracting structured arguments and their source indices from LLM responses.
 * Handles the parsing of formatted text blocks containing arguments and their associated source references.
 */
export declare class OutputParser {
    private config;
    /**
     * Creates a new OutputParser instance
     * @param config - Language-specific configuration for parsing
     */
    constructor(config: LanguageConfig);
    /**
     * Extracts argument strings from the LLM response text
     * @param text - Raw response text from the language model
     * @returns Array of argument strings
     *
     * @example
     * Input text format:
     * <ARGUMENTS>
     * ARGUMENT 1: This is the first argument
     * Sources: [1, 2]
     * ARGUMENT 2: This is the second argument
     * Sources: [3, 4]
     * </ARGUMENTS>
     */
    parseArguments(text: string): string[];
    /**
     * Extracts source indices for each argument from the LLM response text
     * @param text - Raw response text from the language model
     * @returns Array of number arrays, where each inner array contains source indices for one argument
     *
     * @example
     * Input text format:
     * <ARGUMENTS>
     * ARGUMENT 1: First argument text
     * Sources: [1, 2]
     * ARGUMENT 2: Second argument text
     * Sources: [3, 4]
     * </ARGUMENTS>
     *
     * Returns: [[1, 2], [3, 4]]
     */
    parseSourceIndices(text: string): number[][];
}
