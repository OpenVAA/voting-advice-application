import type { QuestionInfoSection, TermDefinition } from '@openvaa/app-shared';
import type { Id } from '@openvaa/core';
import type { LLMObjectGenerationResult } from '@openvaa/llm-refactor';

// ------------------------------------------------------------------
// Types for all possible generation response formats in this package
// -----------------------------------------------------------------

/**
 * Response containing only info sections
 */
export type InfoSectionsOnly = {
  /** Generated informational sections */
  infoSections: Array<QuestionInfoSection>;
};

/**
 * Response containing only term definitions
 */
export type TermsOnly = {
  /** Generated term definitions */
  terms: Array<TermDefinition>;
};

/**
 * Response containing both info sections and term definitions
 */
export type BothOperations = {
  /** Generated informational sections */
  infoSections: Array<QuestionInfoSection>;
  /** Generated term definitions */
  terms: Array<TermDefinition>;
};

/**
 * Union type for all possible response formats
 */
export type ResponseWithInfo = InfoSectionsOnly | TermsOnly | BothOperations;

/**
 * Data payload for question info generation results
 */
export interface QuestionInfoData {
  /** ID of the question that was processed */
  questionId: Id;

  /** Name of the question */
  questionName: string;

  /** Generated info sections (if requested) */
  infoSections?: Array<QuestionInfoSection>;

  /** Generated terms (if requested) */
  terms?: Array<TermDefinition>;
}

/**
 * Result of question info generation
 *
 * @example
 * ```ts
 * const result: QuestionInfoResult = {
 *   runId: 'run_1699123456789_abc123def',
 *   object: {
 *     questionId: 'q1',
 *     questionName: 'Should the capital gains tax be increased?',
 *     infoSections: [
 *       {
 *         title: 'Background',
 *         content: 'Capital gains tax is a tax on the profit...'
 *       }
 *     ],
 *     terms: [
 *       {
 *         triggers: ['capital gains', 'CGT'],
 *         title: 'Capital Gains Tax',
 *         content: 'A tax levied on the profit from the sale...'
 *       }
 *     ]
 *   },
 *   finishReason: 'stop',
 *   usage: { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
 *   success: true,
 *   // ... other properties from GenerateObjectResult and LLMMetadata
 * };
 * ```
 */
export type QuestionInfoResult = LLMObjectGenerationResult<QuestionInfoData> & { success: boolean };
