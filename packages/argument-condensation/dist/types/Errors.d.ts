/**
 * Base error class for argument condensation errors.
 */
export declare class ArgumentCondensationError extends Error {
    readonly cause?: unknown | undefined;
    /**
     * @param message - Error description
     * @param cause - Optional underlying error that caused this error
     */
    constructor(message: string, cause?: unknown | undefined);
}
/**
 * Thrown when the LLM provider fails to generate a response
 */
export declare class LLMError extends ArgumentCondensationError {
    /**
     * @param message - Description of the LLM error
     * @param cause - Optional underlying error from the LLM provider
     */
    constructor(message: string, cause?: unknown);
}
/**
 * Thrown when parsing the LLM response fails
 */
export declare class ParsingError extends ArgumentCondensationError {
    /**
     * @param message - Description of the parsing error
     * @param cause - Optional underlying error that caused parsing to fail
     */
    constructor(message: string, cause?: unknown);
}
