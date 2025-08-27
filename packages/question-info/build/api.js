import { generateInfo } from './core/infoGeneration.js';
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
export async function generateQuestionInfo({ questions, options }) {
    return generateInfo({ questions, options });
}
