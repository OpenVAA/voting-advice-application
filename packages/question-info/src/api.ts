import { SUPPORTED_QINFO_LANG } from './consts';
import { generateInfo } from './core/infoGeneration';
import type { AnyQuestionVariant } from '@openvaa/data';
import type { QuestionInfoOptions, QuestionInfoResult } from './types';

/**
 * Generate question info (sections and/or terms) using LLM
 *
 * @param questions - The question to generate info for
 * @param options - The options for the generation
 * @returns The generated info
 *
 * @example
 * ```ts
 * const info = await generateQuestionInfo({
 *   questions: [q1, q2],
 *   options: {
 *     operations: [QUESTION_INFO_OPERATION.InfoSections]
 *     language: 'en',
 *   }
 * });
 * ```
 */
export async function generateQuestionInfo({
  questions,
  options
}: {
  questions: Array<AnyQuestionVariant>;
  options: QuestionInfoOptions;
}): Promise<Array<QuestionInfoResult>> {
  // Basic input validation and sanity checks
  if (!questions || questions.length === 0) {
    throw new Error('No questions provided for info generation.');
  }
  if (!options.operations || options.operations.length === 0) {
    throw new Error('No operations specified for question info generation.');
  }

  if (!SUPPORTED_QINFO_LANG.includes(options.language)) {
    throw new Error(`Question info generation is only supported using [${SUPPORTED_QINFO_LANG.join(', ')}] prompts for now. Got: ${options.language}. 
      Tip: you may be able to insert data in another language, though the results may still be generated in English.`);
  }

  // Run the info generation
  return generateInfo({ questions, options });
}
