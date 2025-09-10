import type { CommonLLMParams } from '@openvaa/llm';

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
 * const options: QuestionInfoOptions = {
 *   operations: [QUESTION_INFO_OPERATION.Terms, QUESTION_INFO_OPERATION.InfoSections],
 *   language: 'en',
 *   llmProvider: new OpenAIProvider({ apiKey: 'sk-...' }),
 *   llmModel: 'gpt-4o',
 *   questionContext: 'Finnish municipal elections 2025',
 *   customInstructions: 'Focus on local governance aspects',
 *   sectionTopics: ['Background', 'Current situation', 'Key stakeholders']
 * };
 * ```
 */
export interface QuestionInfoOptions extends CommonLLMParams {
  /** Which operations to perform. Can contain either or both of the operations */
  operations: Array<QuestionInfoOperation>;

  /** Language of the prompt to use */
  language: string;

  /** Context to help guide generation. Should contain at least basic details: country and basic election context.
   * Good context increases quality drastically. */
  questionContext?: string;

  /** Optional custom instructions for the generation from the caller */
  customInstructions?: string;

  /** Info sections topics to generate. If not provided, we use a default set. */
  sectionTopics?: Array<string>;
}
