import { Argument } from '../core/types/argument';
import { LanguageConfig } from '../languageOptions/languageConfig.type';
/**
 * Parser for extracting structured Arguments from LLM responses.
 * Handles the parsing of formatted text blocks containing Arguments.
 */
export declare class OutputParser {
    private languageConfig;
    /**
     * Creates a new OutputParser instance
     * @param languageConfig - Language-specific configuration for parsing
     */
    constructor(languageConfig: LanguageConfig);
    /**
     * Extracts Argument strings from the LLM response text
     * @param text - Raw response text from the language model
     * @param topic - The topic of the Arguments
     * @returns Array of Arguments
     *
     * @example
     * Input text format:
     * <ARGUMENTS>
     * ARGUMENT 1: This is the first Argument
     * ARGUMENT 2: This is the second Argument
     * </ARGUMENTS>
     */
    parseArguments(text: string, topic: string): Argument[];
    /**
     * Parses the output from condensing two Argument sets
     * @param output - The LLM response text
     * @returns Argument[] - Array of condensed Arguments
     */
    parseArgumentCondensation(output: string, topic: string): Argument[];
}
//# sourceMappingURL=OutputParser.d.ts.map