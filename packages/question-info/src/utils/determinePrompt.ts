import { QUESTION_INFO_OPERATION } from '../types';

/**
 * Determine which prompt template to use based on operations
 *
 * @param params - Parameters object
 * @param params.operations - Array of operations to perform (terms, infoSections, or both)
 * @returns The prompt key to use for generation
 *
 * @example
 * ```ts
 * // Single operation
 * const key1 = determinePromptKey({ operations: [QUESTION_INFO_OPERATION.Terms] });
 * console.log(key1); // 'generateTerms'
 *
 * // Multiple operations
 * const key2 = determinePromptKey({ operations: [QUESTION_INFO_OPERATION.Terms, QUESTION_INFO_OPERATION.InfoSections] });
 * console.log(key2); // 'generateBoth'
 * ```
 */
export function determinePromptKey({
  operations
}: {
  operations: Array<(typeof QUESTION_INFO_OPERATION)[keyof typeof QUESTION_INFO_OPERATION]>;
}): string {
  // If all operations are provided, use the prompt that generates both
  if (operations.length === Object.values(QUESTION_INFO_OPERATION).length) {
    return 'generateBoth';
  } else if (operations.length === 1 && operations.includes(QUESTION_INFO_OPERATION.InfoSections)) {
    return 'generateInfoSections';
  } else if (operations.length === 1 && operations.includes(QUESTION_INFO_OPERATION.Terms)) {
    return 'generateTerms';
  } else {
    throw new Error(
      `Tried to run question info generation with invalid operations: ${operations.join(', ')}
      Available operations: ${Object.values(QUESTION_INFO_OPERATION).join(', ')}`
    );
  }
}
