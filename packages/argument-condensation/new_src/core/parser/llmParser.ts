import { ResponseWithArguments } from '../types/responseWithArguments';

/**
 * Generic contract for LLM response validation
 */
export interface LLMResponseContract<T> {
  validate(obj: any): obj is T;
}

/**
 * Contract for ResponseWithArguments validation
 */
export const ResponseWithArgumentsContract: LLMResponseContract<ResponseWithArguments> = {
  validate(obj: any): obj is ResponseWithArguments {
    return (
      obj &&
      typeof obj === 'object' &&
      Array.isArray(obj.arguments) &&
      typeof obj.reasoning === 'string' &&
      obj.arguments.every((arg: any) => 
        arg && 
        typeof arg === 'object' &&
        typeof arg.id === 'string' &&
        typeof arg.text === 'string'
      )
    );
  }
};

/**
 * Generic LLM response parser that handles JSON cleaning and validation
 */
export class LlmParser {
  
  /**
   * Generic parse function that validates against a contract
   */
  static parse<T>(response: string, contract: LLMResponseContract<T>): T {
    try {
      const cleanedResponse = this.cleanJson(response);
      const parsed = JSON.parse(cleanedResponse);
      
      // Validate the structure using the provided contract
      if (!contract.validate(parsed)) {
        throw new Error('Invalid response structure: failed contract validation');
      }
      
      return parsed as T;
      
    } catch (error) {
      throw new Error(`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Parse LLM response expecting ResponseWithArguments format
   */
  static parseArguments(response: string): ResponseWithArguments {
    return this.parse(response, ResponseWithArgumentsContract);
  }
  
  /**
   * Clean JSON string to handle common LLM formatting issues
   */
  private static cleanJson(jsonString: string): string {
    let cleaned = jsonString.trim();
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\s*/g, '');
    cleaned = cleaned.replace(/```\s*$/g, '');
    
    // Remove leading/trailing text that might be before/after JSON
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }
    
    // Fix common JSON formatting issues
    cleaned = cleaned
      // Fix unescaped quotes in strings
      .replace(/(?<!\\)"/g, '"')
      // Fix trailing commas
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix missing quotes around property names
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      // Fix single quotes to double quotes
      .replace(/'/g, '"');
    
    return cleaned;
  }
} 