import { runSingleCondensation } from './core/condensation/runner';
import { CONDENSATION_TYPE } from './core/types';
import type { BooleanQuestion, SingleChoiceCategoricalQuestion, SingleChoiceOrdinalQuestion } from '@openvaa/data';
import type { CommentGroup, CondensationAPIOptions, CondensationRunResult } from './core/types';

/**
 * Condense arguments for a boolean question.
 * Generates pros (true) and cons (false) arguments using separate condensation runs & different comments.
 *
 * @param {object} - args - The arguments object.
 * @param {BooleanQuestion} - args.question - The question to condense arguments for.
 * @param {Array<CommentGroup>} - args.commentGroups - The comment groups to condense.
 * @param {CondensationAPIOptions} - args.options - The configuration options for condensation.
 * @param {number} - args.parallelBatches - The number of parallel batches to use for condensation.
 * @returns {Promise<Array<CondensationRunResult>>} A promise that resolves to an array of condensation results.
 */
export async function handleBooleanQuestion({
  question,
  commentGroups,
  options,
  parallelBatches
}: {
  question: BooleanQuestion;
  commentGroups: Array<CommentGroup>;
  options: CondensationAPIOptions;
  parallelBatches: number;
}): Promise<Array<CondensationRunResult>> {
  const results: Array<CondensationRunResult> = [];

  // Condense comments into pros and cons using intelligently filtered comments
  for (const group of commentGroups) {
    if (group.type === 'pro') {
      const prosResult = await runSingleCondensation({
        question,
        comments: group.comments,
        condensationType: CONDENSATION_TYPE.BOOLEAN.PROS,
        options: { ...options, runId: options.runId + '-pros' },
        parallelBatches
      });
      results.push(prosResult);
    } else if (group.type === 'con') {
      const consResult = await runSingleCondensation({
        question,
        comments: group.comments,
        condensationType: CONDENSATION_TYPE.BOOLEAN.CONS,
        options: { ...options, runId: options.runId + '-cons' },
        parallelBatches
      });
      results.push(consResult);
    }
  }

  return results;
}

/**
 * Condense arguments for an ordinal question.
 * Generates pros (high values) and cons (low values) arguments using separate condensation runs & different comments.
 *
 * @param {object} - args - The arguments object.
 * @param {SingleChoiceOrdinalQuestion} - args.question - The question to condense arguments for.
 * @param {Array<CommentGroup>} - args.commentGroups - The comment groups to condense.
 * @param {CondensationAPIOptions} - args.options - The configuration options for condensation.
 * @param {number} - args.parallelBatches - The number of parallel batches to use for condensation.
 * @returns {Promise<Array<CondensationRunResult>>} A promise that resolves to an array of condensation results.
 */
export async function handleOrdinalQuestion({
  question,
  commentGroups,
  options,
  parallelBatches
}: {
  question: SingleChoiceOrdinalQuestion;
  commentGroups: Array<CommentGroup>;
  options: CondensationAPIOptions;
  parallelBatches: number;
}): Promise<Array<CondensationRunResult>> {
  const results: Array<CondensationRunResult> = [];

  // Condense comments into pros and cons using comments that have been chosen by their answer value
  // E.g. for likert-5: use low-scale (1-2) for cons, high-scale (4-5) for pros
  for (const group of commentGroups) {
    if (group.type === 'pro') {
      const prosResult = await runSingleCondensation({
        question,
        comments: group.comments,
        condensationType: CONDENSATION_TYPE.LIKERT.PROS,
        options: { ...options, runId: options.runId + '-pros' },
        parallelBatches
      });
      results.push(prosResult);
    } else if (group.type === 'con') {
      const consResult = await runSingleCondensation({
        question,
        comments: group.comments,
        condensationType: CONDENSATION_TYPE.LIKERT.CONS,
        options: { ...options, runId: options.runId + '-cons' },
        parallelBatches
      });
      results.push(consResult);
    }
  }

  return results;
}

/**
 * Condense arguments for a categorical question.
 * Generates pros arguments for each category using separate condensation runs.
 * Uses category X's comments exclusively to find pros for category X.
 *
 * @param {object} - args - The arguments object.
 * @param {SingleChoiceCategoricalQuestion} - args.question - The question to condense arguments for.
 * @param {Array<CommentGroup>} - args.commentGroups - The comment groups to condense.
 * @param {CondensationAPIOptions} - args.options - The configuration options for condensation.
 * @param {number} - args.parallelBatches - The number of parallel batches to use for condensation.
 * @returns {Promise<Array<CondensationRunResult>>} A promise that resolves to an array of condensation results.
 */
export async function handleCategoricalQuestion({
  question,
  commentGroups,
  options,
  parallelBatches
}: {
  question: SingleChoiceCategoricalQuestion;
  commentGroups: Array<CommentGroup>;
  options: CondensationAPIOptions;
  parallelBatches: number;
}): Promise<Array<CondensationRunResult>> {
  const results: Array<CondensationRunResult> = [];

  // Condense comments into pros for each category
  for (const group of commentGroups) {
    if (group.type === 'categoricalChoice') {
      const categoryResult = await runSingleCondensation({
        question,
        comments: group.comments,
        condensationType: CONDENSATION_TYPE.CATEGORICAL.PROS,
        options: { ...options, runId: options.runId + group.choiceId },
        parallelBatches
      });
      results.push(categoryResult);
    }
  }

  return results;
}
