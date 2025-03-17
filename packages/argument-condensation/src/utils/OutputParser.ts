import { Argument } from '../types/Argument';
import { LanguageConfig } from '../types/LanguageConfig';

/**
 * Parser for extracting structured arguments and their source indices from LLM responses.
 * Handles the parsing of formatted text blocks containing arguments and their associated source references.
 */
export class OutputParser {
  private config: LanguageConfig;

  /**
   * Creates a new OutputParser instance
   * @param config - Language-specific configuration for parsing
   */
  constructor(config: LanguageConfig) {
    this.config = config;
  }

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
  parseArguments(text: string): string[] {
    const parsedArgs: string[] = [];
    const lines: string[] = text.split('\n');

    let currentArg: string[] = [];
    let processing: boolean = false; // Tracks if we're inside the <ARGUMENTS> block

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Handle argument block boundaries
      if (trimmedLine.includes('<ARGUMENTS>')) {
        processing = true;
        continue;
      } else if (trimmedLine.includes('</ARGUMENTS>')) {
        break;
      }
      
      // Process lines within the argument block
      if (processing) {
        if (trimmedLine.startsWith(this.config.outputFormat.argumentPrefix)) {
          // Start of new argument - save previous if exists
          if (currentArg.length) {
            parsedArgs.push(currentArg.join(' '));
            currentArg = [];
          }
          // Extract argument text after the prefix and colon
          currentArg = [trimmedLine.split(':', 2)[1].trim()];
        } else if (!trimmedLine.startsWith(this.config.outputFormat.sourcesPrefix) && trimmedLine) {
          // Continuation of current argument (multi-line)
          currentArg.push(trimmedLine);
        }
      }
    }

    // Add final argument if it exists
    if (currentArg.length) {
      parsedArgs.push(currentArg.join(' '));
    }

    return parsedArgs;
  }

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
  parseSourceIndices(text: string): number[][] {
    const sourceIndicesPerArg: number[][] = [];
    const lines: string[] = text.split('\n');
    let processing: boolean = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Handle argument block boundaries
      if (trimmedLine.includes('<ARGUMENTS>')) {
        processing = true;
        continue;
      } else if (trimmedLine.includes('</ARGUMENTS>')) {
        break;
      }
      
      // Process source index lines
      if (processing && trimmedLine.startsWith(this.config.outputFormat.sourcesPrefix)) {
        // Extract numbers from the sources line
        const numbersStr = trimmedLine
          .split(':', 2)[1]
          .trim()
          .replace(/[\[\]]/g, '');

        if (numbersStr) {
          // Parse and validate numbers
          const numbers = numbersStr
            .split(',')
            .map((numStr) => {
              const matches = numStr.trim().match(/\d+/);
              return matches ? parseInt(matches[0]) : null;
            })
            .filter((num): num is number => num !== null);
          sourceIndicesPerArg.push(numbers);
        } else {
          sourceIndicesPerArg.push([]);
        }
      }
    }

    return sourceIndicesPerArg;
  }
  /**
 * Parses the output from recursive condensation of two argument sets
   * @param output - The LLM response text
   * @returns Argument[] - Array of condensed arguments
   */
  parseRecursiveCondensation(output: string, topic: string): Argument[] {
    const lines = output.split('\n');
    const args: Argument[] = [];
    
    const argumentPrefix = this.config.outputFormat.argumentPrefix;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith(argumentPrefix)) {
        // Remove any existing indices like "1:", "2:" at the beginning of arguments
        const argumentText = line.substring(argumentPrefix.length).trim().replace(/^\s*\d+\s*:\s*/, ''); 
        
        // Create a new argument with the condensed text
        // We don't have direct sources for these condensed arguments,
        // but we could potentially track which original arguments contributed
        args.push({
          argument: argumentText,
          sourceComments: [], // Could be enhanced to track original sources
          sourceIndices: [],
          topic: topic
        });
      }
    }
    
    return args;
  } 
}
