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

  /** Examples to guide generation, preferably with the output examples in JSON format. See example */
  examples?: {
    infoSections?: string;
    terms?: string;
  };
}
