import type { LLMResponseContract } from '@openvaa/llm';
import type { ResponseWithArguments } from '../../types/llm/responseWithArguments';

/**
 * Contract for validating `ResponseWithArguments` (see example below).
 * This ensures that the LLM output conforms to the expected structure
 * containing arguments and reasoning before it is used further in the application.
 *
 * @example
 * const response: ResponseWithArguments = {
 *   arguments: [{ id: '123', text: 'This is an argument' }],
 *   reasoning: 'This is a reason'
 * };
 *
 * const isValid = RESPONSE_WITH_ARGUMENTS_CONTRACT.validate(response); // returns true for this example
 *
 */
export const RESPONSE_WITH_ARGUMENTS_CONTRACT: LLMResponseContract<ResponseWithArguments> = {
  validate(obj: unknown): obj is ResponseWithArguments {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    const candidate = obj as Record<string, unknown>;

    if (!Array.isArray(candidate.arguments) || typeof candidate.reasoning !== 'string') {
      return false;
    }

    return candidate.arguments.every((arg: unknown) => {
      if (!arg || typeof arg !== 'object') {
        return false;
      }
      const argCandidate = arg as Record<string, unknown>;
      return typeof argCandidate.id === 'string' && typeof argCandidate.text === 'string';
    });
  }
};
