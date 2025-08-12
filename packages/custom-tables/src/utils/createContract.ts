import type { LLMResponseContract } from '@openvaa/llm';

/**
 * Creates a response contract for a given type
 * @param typeKey - The key of the type to create a contract for
 * @returns A response contract for the given type
 */
export function createResponseContract<TType>(typeKey: string): LLMResponseContract<TType> {
  if (typeKey === 'SimpleEntirySummaryResponse') {
    return {
      validate: (obj): obj is TType => {
        if (typeof obj !== 'object' || obj === null) {
          return false;
        }
        return 'summary' in obj && typeof obj.summary === 'string';
      }
    };
  } else {
    throw new Error(`No response contract found for typeKey: ${typeKey}`);
  }
}
