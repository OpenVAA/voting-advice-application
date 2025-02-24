"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParsingError = exports.LLMError = exports.ArgumentCondensationError = void 0;
/**
 * Base error class for argument condensation errors.
 * Provides detailed messages and optional cause tracking.
 */
class ArgumentCondensationError extends Error {
    /**
     * @param message - Error description
     * @param cause - Optional underlying error that caused this error
     */
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'ArgumentCondensationError';
    }
}
exports.ArgumentCondensationError = ArgumentCondensationError;
/**
 * Thrown when the LLM provider fails to generate a response
 */
class LLMError extends ArgumentCondensationError {
    /**
     * @param message - Description of the LLM error
     * @param cause - Optional underlying error from the LLM provider
     */
    constructor(message, cause) {
        super(`LLM error: ${message}`, cause);
        this.name = 'LLMError';
    }
}
exports.LLMError = LLMError;
/**
 * Thrown when parsing the LLM response fails
 */
class ParsingError extends ArgumentCondensationError {
    /**
     * @param message - Description of the parsing error
     * @param cause - Optional underlying error that caused parsing to fail
     */
    constructor(message, cause) {
        super(`Failed to parse LLM response: ${message}`, cause);
        this.name = 'ParsingError';
    }
}
exports.ParsingError = ParsingError;
