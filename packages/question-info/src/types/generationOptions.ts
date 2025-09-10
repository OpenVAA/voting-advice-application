import type { CommonLLMParams } from '@openvaa/llm';

/**
 * Available operations for question info generation
 */
export const QUESTION_INFO_OPERATION = {
  Terms: 'terms',
  InfoSections: 'infoSections'
} as const;

export type QuestionInfoOperation = (typeof QUESTION_INFO_OPERATION)[keyof typeof QUESTION_INFO_OPERATION];

/**
 * Options for question info generation
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