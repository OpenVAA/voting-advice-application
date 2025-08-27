import { jsonrepair } from 'jsonrepair';

/**
 * Generic contract for LLM response validation
 */
export interface LLMResponseContract<TType> {
  validate(obj: unknown): obj is TType;
}

/**
 * Custom error for validation failures
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly unparsedText: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Type guard for `ValidationError`.
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof Error && error.name === 'ValidationError';
}

/**
 * Clean JSON string to handle common LLM formatting issues
 */
export function cleanJson(jsonString: string): string {
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

/**
 * Generic parse function that validates against a contract
 */
export function parseAndValidate<TType>(response: string, contract: LLMResponseContract<TType>): TType {
  const cleanedResponse = cleanJson(response);
  try {
    const parsed = JSON.parse(cleanedResponse);

    // Validate the structure using the provided contract
    if (!contract.validate(parsed)) {
      throw new ValidationError('Invalid response structure: failed contract validation', cleanedResponse);
    }

    return parsed as TType;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new ValidationError(`JSON parsing error: ${errorMessage}`, cleanedResponse);
  }
}
