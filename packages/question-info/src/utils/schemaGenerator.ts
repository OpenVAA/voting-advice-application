import { z } from 'zod';
import { QUESTION_INFO_OPERATION } from '../types';
import type { QuestionInfoOperation } from '../types';

/**
 * Zod schema for a single info section
 */
const infoSectionSchema = z.object({
  title: z.string(),
  content: z.string()
});

/**
 * Zod schema for a single term definition
 */
const termSchema = z.object({
  triggers: z.array(z.string()),
  title: z.string(),
  content: z.string()
});

/**
 * Create a dynamic Zod schema based on the requested operations
 *
 * @param params - Parameters object
 * @param params.operations - The operations to include in the schema
 * @returns A Zod schema that validates the requested operations
 *
 * @example
 * ```ts
 * // Generate a schema with both info sections and terms
 * const schema = chooseQInfoSchema({
 *   operations: [QUESTION_INFO_OPERATION.InfoSections, QUESTION_INFO_OPERATION.Terms]
 * });
 * const result = schema.parse({
 *   infoSections: [{ title: 'Info Section 1', content: 'Info Section 1 content' }],
 *   terms: [{ triggers: ['trigger1', 'trigger2'], title: 'Term 1', content: 'Term 1 content' }]
 * });
 * ```
 */
export function chooseQInfoSchema({ operations }: { operations: Array<QuestionInfoOperation> }): z.ZodSchema {
  if (operations.length === 0) {
    throw new Error('At least one operation must be specified');
  }

  const includeInfoSections = operations.includes(QUESTION_INFO_OPERATION.InfoSections);
  const includeTerms = operations.includes(QUESTION_INFO_OPERATION.Terms);

  // Both operations
  if (includeInfoSections && includeTerms) {
    return z.object({
      infoSections: z.array(infoSectionSchema),
      terms: z.array(termSchema)
    });
  }

  // Info sections only
  if (includeInfoSections) {
    return z.object({
      infoSections: z.array(infoSectionSchema)
    });
  }

  // Terms only
  if (includeTerms) {
    return z.object({
      terms: z.array(termSchema)
    });
  }

  throw new Error('No valid operations specified');
}
