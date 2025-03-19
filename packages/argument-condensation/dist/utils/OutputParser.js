"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputParser = void 0;
/**
 * Parser for extracting structured Arguments from LLM responses.
 * Handles the parsing of formatted text blocks containing Arguments.
 */
class OutputParser {
    /**
     * Creates a new OutputParser instance
     * @param languageConfig - Language-specific configuration for parsing
     */
    constructor(languageConfig) {
        this.languageConfig = languageConfig;
    }
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
    parseArguments(text, topic) {
        // Initialization of basic variables
        const parsedArgs = []; // Array to be populated by Arguments
        let currentArg = ''; // Used to build the current Argument's string if it's multi-lined in the text
        let stillProcessing = false; // Tracks if we're inside the <ARGUMENTS> block
        // Split the LLM response into lines
        const lines = text.split('\n');
        // Iterate over lines of the response
        for (const line of lines) {
            const trimmedLine = line.trim();
            // Check if we're inside the <ARGUMENTS> block
            if (trimmedLine.includes('<ARGUMENTS>')) {
                stillProcessing = true;
                continue;
            }
            else if (trimmedLine.includes('</ARGUMENTS>')) {
                break;
            }
            // Process lines within the Arguments block
            if (stillProcessing) {
                // Check if the line starts with the correct Argument prefix 
                if (trimmedLine.startsWith(this.languageConfig.outputFormat.argumentPrefix)) {
                    // Start of new Argument
                    if (currentArg.length) {
                        parsedArgs.push({
                            argument: currentArg,
                            topic: topic
                        });
                        currentArg = '';
                    }
                    // Extract argument text after the prefix and colon
                    currentArg = trimmedLine.split(':', 2)[1].trim();
                }
                else if (trimmedLine) {
                    // Continuation of the current Argument's string (only occurs if it's multi-lined)
                    currentArg += trimmedLine;
                }
            }
        }
        // Add the final Argument if it exists
        if (currentArg.length) {
            parsedArgs.push({
                argument: currentArg,
                topic: topic
            });
        }
        return parsedArgs;
    }
    /**
     * Parses the output from condensing two Argument sets
     * @param output - The LLM response text
     * @returns Argument[] - Array of condensed Arguments
     */
    parseArgumentCondensation(output, topic) {
        // Intialize empty Argument array
        const args = [];
        // Get the correctArgument prefix from the language config
        const argumentPrefix = this.languageConfig.outputFormat.argumentPrefix;
        // Split the LLM response into lines
        const lines = output.split('\n');
        // Iterate over lines of the response
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Check if the line starts with the correct Argument prefix 
            if (line.startsWith(argumentPrefix)) {
                // Remove any existing indices like "1:" at the beginning of Arguments
                const argumentText = line.substring(argumentPrefix.length).trim().replace(/^\s*\d+\s*:\s*/, '');
                // Create a new Argument with the condensed text
                args.push({
                    argument: argumentText,
                    topic: topic
                });
            }
        }
        return args;
    }
}
exports.OutputParser = OutputParser;
