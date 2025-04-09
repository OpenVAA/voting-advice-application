import { Argument } from '../types/argument';
import { LanguageConfig } from '../languageOptions/languageConfig.type';

/**
 * Parser for extracting structured Arguments from LLM responses.
 * Handles the parsing of formatted text blocks containing Arguments.
 */
export class OutputParser {
  private languageConfig: LanguageConfig;

  /**
   * Creates a new OutputParser instance
   * @param languageConfig - Language-specific configuration for parsing
   */
  constructor(languageConfig: LanguageConfig) {
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
  parseArguments(text: string, topic: string): Argument[] {
    /** Array to be populated by Arguments */
    const parsedArgs = new Array<Argument>();   

    /** Used to build the current Argument's string if it's multi-lined in the text */
    let currentArg = '';

    /** Tracks if we're inside the <ARGUMENTS> block */
    let stillProcessing = false;

    /** Split the LLM response into lines */
    const lines = text.split('\n');

    // Iterate over lines of the response 
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      /** Check if we're inside the <ARGUMENTS> block */
      if (trimmedLine.includes('<ARGUMENTS>')) {
        stillProcessing = true;
        continue;
      } else if (trimmedLine.includes('</ARGUMENTS>')) {
        break;
      }
      
      /** Process lines within the Arguments block */
      if (stillProcessing) {
        /** Check if the line starts with the correct Argument prefix  */
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
        } else if (trimmedLine) {
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
  parseArgumentCondensation(output: string, topic: string): Argument[] {
    /** Array to populate with condensed Arguments */
    const args = new Array<Argument>();

    /** Argument prefix from the language config */
    const argumentPrefix = this.languageConfig.outputFormat.argumentPrefix;

    /** LLM response as lines */
    const lines = output.split('\n');

    // Iterate over lines of the response
    for (const line of lines) {   
      // Check if the line starts with the correct Argument prefix 
      if (line.startsWith(argumentPrefix)) {
        /** Pure argument string with prefixes like "1:" removed */
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
