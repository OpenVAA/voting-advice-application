import { QUESTION_INFO_OPERATION } from '../types/index.js';
import type { LLMResponseContract } from '@openvaa/llm';
import type { ResponseWithInfo } from '../types/index.js';
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
export declare function createDynamicResponseContract(operations: Array<(typeof QUESTION_INFO_OPERATION)[keyof typeof QUESTION_INFO_OPERATION]>): LLMResponseContract<ResponseWithInfo>;
//# sourceMappingURL=schemaGenerator.d.ts.map