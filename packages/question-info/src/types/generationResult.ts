import type { QuestionInfoSection, TermDefinition } from '@openvaa/app-shared';
import type { Id } from '@openvaa/core';
import type { LLMResult } from '@openvaa/llm';

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
 *   data: {
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
 *   metrics: {
 *     duration: 2.5,
 *     nLlmCalls: 1,
 *     cost: 0.05,
 *     tokensUsed: { inputs: 1000, outputs: 500, total: 1500 }
 *   },
 *   success: true,
 *   metadata: {
 *     llmModel: 'gpt-4o',
 *     language: 'en',
 *     startTime: new Date('2024-01-01T10:00:00Z'),
 *     endTime: new Date('2024-01-01T10:00:02Z')
 *   }
 * };
 * ```
 */
export type QuestionInfoResult = LLMResult<QuestionInfoData>;