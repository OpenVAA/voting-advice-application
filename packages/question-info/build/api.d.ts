import type { AnyQuestionVariant } from '@openvaa/data';
import type { QuestionInfoOptions, QuestionInfoResult } from './types/index.js';
/**
 * Generate question info (sections and/or terms) using LLM
 *
 * @param questions - The question to generate info for. Should be an opinion question variant but we don't check for that yet
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
export declare function generateQuestionInfo({ questions, options }: {
    questions: Array<AnyQuestionVariant>;
    options: QuestionInfoOptions;
}): Promise<Array<QuestionInfoResult>>;
//# sourceMappingURL=api.d.ts.map