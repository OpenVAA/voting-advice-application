import { QUESTION_INFO_OPERATION } from '../types';
import type { LLMResponseContract } from '@openvaa/llm';
import type { BothOperations, InfoSectionsOnly, ResponseWithInfo, TermsOnly } from '../types';

/**
 * Create a dynamic response contract based on the requested operations
 *
 * @param operations - The operations to include in the schema
 * @returns A LLMResponseContract object with the requested operations
 *
 * @example
 * ```ts
 * // Generate a contract with both info sections and terms
 * const contract = createDynamicResponseContract([QUESTION_INFO_OPERATION.InfoSections, QUESTION_INFO_OPERATION.Terms]);
 * const result = contract.validate({
 *   infoSections: [{ title: 'Info Section 1', content: 'Info Section 1 content' }],
 *   terms: [{ triggers: ['trigger1', 'trigger2'], title: 'Term 1', content: 'Term 1 content' }]
 * });
 * console.log(result); // Returns true
 * ```
 */
export function createDynamicResponseContract(
  operations: Array<(typeof QUESTION_INFO_OPERATION)[keyof typeof QUESTION_INFO_OPERATION]>
): LLMResponseContract<ResponseWithInfo> {
  if (operations.length === 0) {
    throw new Error('At least one operation must be specified');
  }

  return {
    validate: (obj: unknown): obj is ResponseWithInfo => {
      if (typeof obj !== 'object' || obj === null) return false;

      const candidate = obj as ResponseWithInfo;

      // Both operations
      if (
        operations.includes(QUESTION_INFO_OPERATION.InfoSections) &&
        operations.includes(QUESTION_INFO_OPERATION.Terms)
      ) {
        return validateBoth(candidate as BothOperations);
      }

      // Info sections only
      if (operations.includes(QUESTION_INFO_OPERATION.InfoSections)) {
        return validateInfoSections(candidate as InfoSectionsOnly);
      }

      // Terms only
      if (operations.includes(QUESTION_INFO_OPERATION.Terms)) {
        return validateTerms(candidate as TermsOnly);
      }

      return false;
    }
  };
}

function validateInfoSections(obj: InfoSectionsOnly): boolean {
  if (!Array.isArray(obj.infoSections)) return false;
  for (const section of obj.infoSections) {
    if (typeof section.title !== 'string' || typeof section.content !== 'string') {
      return false;
    }
  }
  return true;
}

function validateTerms(obj: TermsOnly): boolean {
  if (!Array.isArray(obj.terms)) return false;
  for (const term of obj.terms) {
    if (!Array.isArray(term.triggers) || typeof term.title !== 'string' || typeof term.content !== 'string') {
      return false;
    }
    for (const trigger of term.triggers) {
      if (typeof trigger !== 'string') return false;
    }
  }
  return true;
}

function validateBoth(obj: BothOperations): boolean {
  // Reuse validation logic by extracting the infoSections and terms into new objects of the correct type
  return validateInfoSections({ infoSections: obj.infoSections }) && validateTerms({ terms: obj.terms });
}
