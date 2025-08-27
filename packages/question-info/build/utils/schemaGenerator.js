import { QUESTION_INFO_OPERATION } from '../types/index.js';
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
 *   infoSections: [{ title: 'Info Section 1', content: 'Info Section 1 content', visible: true }],
 *   terms: [{ triggers: ['trigger1', 'trigger2'], title: 'Term 1', content: 'Term 1 content' }]
 * });
 * console.log(result); // Returns true
 * ```
 */
export function createDynamicResponseContract(operations) {
    if (operations.length === 0) {
        throw new Error('At least one operation must be specified');
    }
    return {
        validate: (obj) => {
            if (typeof obj !== 'object' || obj === null)
                return false;
            const candidate = obj;
            // Both operations
            if (operations.includes(QUESTION_INFO_OPERATION.InfoSections) &&
                operations.includes(QUESTION_INFO_OPERATION.Terms)) {
                return validateBoth(candidate);
            }
            // Info sections only
            if (operations.includes(QUESTION_INFO_OPERATION.InfoSections)) {
                return validateInfoSections(candidate);
            }
            // Terms only
            if (operations.includes(QUESTION_INFO_OPERATION.Terms)) {
                return validateTerms(candidate);
            }
            return false;
        }
    };
}
function validateInfoSections(obj) {
    if (!Array.isArray(obj.infoSections))
        return false;
    for (const section of obj.infoSections) {
        if (typeof section.title !== 'string' ||
            typeof section.content !== 'string' ||
            typeof section.visible !== 'boolean') {
            return false;
        }
    }
    return true;
}
function validateTerms(obj) {
    if (!Array.isArray(obj.terms))
        return false;
    for (const term of obj.terms) {
        if (!Array.isArray(term.triggers) || typeof term.title !== 'string' || typeof term.content !== 'string') {
            return false;
        }
        for (const trigger of term.triggers) {
            if (typeof trigger !== 'string')
                return false;
        }
    }
    return true;
}
function validateBoth(obj) {
    // Reuse validation logic by extracting the infoSections and terms into new objects of the correct type
    return validateInfoSections({ infoSections: obj.infoSections }) && validateTerms({ terms: obj.terms });
}
