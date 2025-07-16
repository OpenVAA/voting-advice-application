import { LLMResponseContract } from '../../../../../llm/src/utils/llmParser';
import { Argument } from '../argument';
/**
 * Expected structure for LLM response containing arguments and reasoning
 */
export interface ResponseWithArguments {
  arguments: Array<Argument>;
  reasoning: string;
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