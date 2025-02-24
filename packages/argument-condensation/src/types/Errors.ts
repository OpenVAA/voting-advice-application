/**
 * Base error class for argument condensation errors.
 * Provides detailed messages and optional cause tracking.
 */
export class ArgumentCondensationError extends Error {
  /**
   * @param message - Error description
   * @param cause - Optional underlying error that caused this error
   */
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ArgumentCondensationError';
  }
}

/**
 * Thrown when the LLM provider fails to generate a response
 */
export class LLMError extends ArgumentCondensationError {
  /**
   * @param message - Description of the LLM error
   * @param cause - Optional underlying error from the LLM provider
   */
  constructor(message: string, cause?: unknown) {
    super(`LLM error: ${message}`, cause);
    this.name = 'LLMError';
  }
}

/**
 * Thrown when parsing the LLM response fails
 */
export class ParsingError extends ArgumentCondensationError {
  /**
   * @param message - Description of the parsing error
   * @param cause - Optional underlying error that caused parsing to fail
   */
  constructor(message: string, cause?: unknown) {
    super(`Failed to parse LLM response: ${message}`, cause);
    this.name = 'ParsingError';
  }
} 