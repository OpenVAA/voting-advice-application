import type { QuestionInfoSection, TermDefinition } from '@openvaa/app-shared';
import type { Id } from '@openvaa/core';
import type { CommonLLMParams } from '@openvaa/llm';
import type { LLMObjectGenerationResult, LLMPipelineResult } from '@openvaa/llm';

// --------------------------------------------------
// INFO GENERATION OPTIONS (= INPUT-RELATED TYPES)
// --------------------------------------------------

/**
 * Available operations for question info generation
 *
 * @example
 * ```ts
 * // Generate only term definitions
 * const operations = [QUESTION_INFO_OPERATION.Terms];
 *
 * // Generate only info sections
 * const operations = [QUESTION_INFO_OPERATION.InfoSections];
 *
 * // Generate both
 * const operations = [QUESTION_INFO_OPERATION.Terms, QUESTION_INFO_OPERATION.InfoSections];
 * ```
 */
export const QUESTION_INFO_OPERATION = {
  /** Generate term definitions for key concepts in the question */
  Terms: 'terms',
  /** Generate informational sections providing background context */
  InfoSections: 'infoSections'
} as const;

export type QuestionInfoOperation = (typeof QUESTION_INFO_OPERATION)[keyof typeof QUESTION_INFO_OPERATION];

/**
 * Options for question info generation
 *
 * @example
 * ```ts
 * const llmProvider = new LLMProvider({
 *   provider: 'openai',
 *   apiKey: process.env.OPENAI_API_KEY!,
 *   modelConfig: { primary: 'gpt-4o', fallback: 'gpt-4o-mini' }
 * });
 *
 * const options: QuestionInfoOptions = {
 *   operations: [QUESTION_INFO_OPERATION.Terms, QUESTION_INFO_OPERATION.InfoSections],
 *   language: 'en',
 *   llmProvider,
 *   modelConfig: { primary: 'gpt-4o' },
 *   questionContext: 'Finnish municipal elections 2025',
 *   customInstructions: 'Focus on local governance aspects',
 *   sectionTopics: ['Background', 'Current situation', 'Key stakeholders']
 * };
 * ```
 */
export interface QuestionInfoOptions extends CommonLLMParams {
  /** Which operations to perform. Can contain either or both of the operations */
  operations: Array<QuestionInfoOperation>;

  /** Context to help guide generation. Should contain at least basic details: country and basic election context.
   * Good context increases quality drastically. */
  questionContext?: string;

  /** Optional custom instructions for the generation from the caller */
  customInstructions?: string;

  /** Info sections topics to generate. If not provided, we use a default set. */
  sectionTopics?: Array<string>;
}

// --------------------------------------------------
// RESPONSE FORMATS (= OUTPUT-RELATED TYPES)
// --------------------------------------------------

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

  /** Generated info sections (if requested) */
  infoSections?: Array<QuestionInfoSection>;

  /** Generated terms (if requested) */
  terms?: Array<TermDefinition>;
}

// We don't really care about adding fields to this type because the typing parametrization
// clearly differentiates the result from supertype...
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface QuestionInfoResult extends LLMPipelineResult<QuestionInfoData> {}

/**
 * Raw information from question info generation. This is not the same as the package's
 * output type QuestionInfoResult. This type is concerned with LLM interaction, whereas
 * QuestionInfoResult is concerned with the package's output type.
 *
 * @example
 * ```ts
 * const result: QuestionInfoRaw = {
 *   object: {
 *     questionId: 'q1',
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
 *   latencyMs: 1000,
 *   attempts: 1,
 *   costs: { input: 0.0001, output: 0.0002, total: 0.0003 }, // in dollars
 *   finishReason: 'stop',
 *   usage: { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
 *   success: true,
 *   // ... other properties from GenerateObjectResult and LLMMetadata
 * };
 * ```
 */
export type QuestionInfoRawResponse = LLMObjectGenerationResult<ResponseWithInfo> & { success: boolean };
