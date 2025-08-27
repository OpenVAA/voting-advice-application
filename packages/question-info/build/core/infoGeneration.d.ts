import type { AnyQuestionVariant } from '@openvaa/data';
import type { QuestionInfoOptions, QuestionInfoResult } from '../types/index.js';
/**
 * Generate question info for any number of questions with parallelization
 * @param questions - The questions to generate info for
 * @param options - The options for the info generation
 * @returns The generated info for the questions
 * @throws Error if the generation fails
 * @throws Error if the operations are invalid
 *
 * @example
 * ```ts
 * const questions = [{ id: '1', name: 'Question 1', content: 'What is the capital of France?' }];
 * const options: QuestionInfoOptions = { operations: [QUESTION_INFO_OPERATION.InfoSections, QUESTION_INFO_OPERATION.Terms], language: 'en' };
 * const results = await generateQuestionInfo(questions, options);
 * console.log(results); // Array of QuestionInfoResult
 *
 * ```
 */
export declare function generateInfo({ questions, options }: {
    questions: Array<AnyQuestionVariant>;
    options: QuestionInfoOptions;
}): Promise<Array<QuestionInfoResult>>;
//# sourceMappingURL=infoGeneration.d.ts.map