import { handleQuestion } from '../core/orchestration/handleQuestion';
import { createVAAComments } from '../core/types/api/createVAAComments';
import type { HasAnswers } from '@openvaa/core';
import type { SupportedQuestion } from '../core/types';
import type { CondensationOptions } from '../core/types/condensation/condensationInput';
import type { CondensationRunResult } from '../core/types/condensation/condensationResult';

/**
 * Main package API: Condense arguments for a single question.
 *
 * This function takes a question and entities with answers, then runs the appropriate
 * condensation process based on the question type:
 * - Boolean: Generates pros (true) and cons (false) arguments
 * - Ordinal: Generates pros (high values) and cons (low values) arguments
 * - Categorical: Generates pros arguments for each category
 *
 * The function gracefully handles entities that don't have answer info text - they are
 * simply filtered out during processing.
 *
 * @param question - The question to condense arguments for
 * @param entities - Entities with answers (answers may or may not have info text)
 * @param options - Condensation configuration options
 * @returns Promise resolving to condensation results
 */
export async function condenseQuestion(
  question: SupportedQuestion,
  entities: Array<HasAnswers>,
  options: CondensationOptions
): Promise<Array<CondensationRunResult>> {
  // Transform repository data to condensation format
  const comments = createVAAComments(question, entities);

  if (comments.length === 0) {
    throw new Error(
      `No valid comments found for question ${question.id}. Entities must have answers with 'info' text to condense.`
    );
  }

  // Run condensation using existing handleQuestion logic
  const individualResults = await handleQuestion({
    question,
    comments,
    llmProvider: options.llmProvider,
    language: options.language, // Force admin to input language
    model: options.model ?? 'gpt-4o',
    runId: options.runId ?? 'question_condensation',
    maxCommentsPerGroup: options.maxCommentsPerGroup ?? 200
  });

  return individualResults;
}
