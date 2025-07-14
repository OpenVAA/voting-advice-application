import { jsonrepair } from 'jsonrepair';
import { ResponseWithArguments } from '../types/responseWithArguments';

/**
 * Generic contract for LLM response validation
 */
export interface LLMResponseContract<TType> {
  validate(obj: unknown): obj is TType;
}

/**
 * Contract for ResponseWithArguments validation
 */
export const ResponseWithArgumentsContract: LLMResponseContract<ResponseWithArguments> = {
  validate(obj: unknown): obj is ResponseWithArguments {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    const candidate = obj as Record<string, unknown>;

    return (
      Array.isArray(candidate.arguments) &&
      typeof candidate.reasoning === 'string' &&
      candidate.arguments.every((arg: unknown) => {
        if (!arg || typeof arg !== 'object') {
          return false;
        }
        const argCandidate = arg as Record<string, unknown>;
        return typeof argCandidate.id === 'string' && typeof argCandidate.text === 'string';
      })
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
  static parse<TType>(response: string, contract: LLMResponseContract<TType>): TType {
    try {
      const cleanedResponse = this.cleanJson(response);
      const parsed = JSON.parse(cleanedResponse);

      // Validate the structure using the provided contract
      if (!contract.validate(parsed)) {
        throw new Error('Invalid response structure: failed contract validation');
      }

      return parsed as TType;
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

    // Use jsonrepair to fix malformed JSON
    try {
      return jsonrepair(cleaned);
    } catch {
      // If jsonrepair fails, return the cleaned string as-is
      return cleaned;
    }
  }
}
