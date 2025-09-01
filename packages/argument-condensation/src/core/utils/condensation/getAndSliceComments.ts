import { BaseController, type HasAnswers, type Id, isMissingValue } from '@openvaa/core';
import {
  type Answer,
  type BooleanQuestion,
  QUESTION_TYPE,
  type SingleChoiceCategoricalQuestion,
  type SingleChoiceOrdinalQuestion
} from '@openvaa/data';
import { COMMENT_PROCESSING } from '../../../defaultValues';
import type { CommentGroup, CommentGroupingOptions } from '../../types/api/commentGroup';
import type { Comment } from '../../types/condensation/condensationInput';
import type { SupportedQuestion } from '../../types/condensation/supportedQuestion';

/**
 * Transforms and groups candidate comments for argument condensation.
 * This function uses the question's built-in `normalizeValue()` method
 * to systematically group comments for all question types. Also slices
 * the correct number of comments according to the `maxCommentsPerGroup`
 * option if there are more comments than necessary.
 *
 * The classification logic is based on the [-0.5, 0.5] coordinate space
 * returned by `normalizeValue()`:
 * - Pro-arguments: normalized value > 0
 * - Con-arguments: normalized value < 0
 * - Neutral-arguments (ignored): normalized value = 0
 *
 * @param question - The question to group comments for
 * @param entities - The entities to get comments from
 * @param options - The options for grouping comments
 * @param options.invertProsAndCons - Whether to invert the pro/con classification for ordinal questions
 * @param options.maxCommentsPerGroup - Maximum number of comments from a single answer option to use
 * @param options.controller - Optional controller for warning messages during comment grouping
 * @returns An array of comment groups (type commentGroup)
 */
export function getAndSliceComments({
  question,
  entities,
  options
}: {
  question: SupportedQuestion;
  entities: Array<HasAnswers>;
  options: CommentGroupingOptions;
}): Array<CommentGroup> {
  const { invertProsAndCons, maxCommentsPerGroup, controller } = options;
  const actualLogger = controller ?? new BaseController();

  const prosComments: Array<Comment> = [];
  const consComments: Array<Comment> = [];
  const commentsByChoice = new Map<Id, Array<Comment>>();

  for (const [i, entity] of entities.entries()) {
    const answer = entity.answers[question.id] as Answer<boolean | string>;

    if (!answer?.info?.trim()) {
      continue;
    }

    const entityId = (entity as { id?: Id }).id ?? `entity_index_${i}`;
    const vaaComment: Comment = {
      id: `${entityId}_${question.id}`,
      entityId: entityId,
      entityAnswer: String(answer.value ?? ''),
      text: answer.info
    };

    switch (question.type) {
      case QUESTION_TYPE.Boolean:
      case QUESTION_TYPE.SingleChoiceOrdinal: {
        let normalizedValue: number | undefined;

        try {
          // Use the question's built-in normalization, which returns a value in the [-0.5, 0.5] range
          const normalized =
            question.type === QUESTION_TYPE.Boolean
              ? (question as BooleanQuestion).normalizeValue((answer as Answer<boolean>).value)
              : (question as SingleChoiceOrdinalQuestion).normalizeValue((answer as Answer<string>).value);

          if (isMissingValue(normalized)) {
            continue;
          }
          // Handle the array case for type safety
          normalizedValue = Array.isArray(normalized) ? normalized[0] : normalized;
        } catch (error) {
          actualLogger.warning(
            `Skipping invalid answer for entity ${i}, question ${question.id}: ${error instanceof Error ? error.message : error}`
          );
          continue;
        }

        // Ignore neutral values, which are normalized to 0
        if (normalizedValue === 0) {
          continue;
        }

        // Ditch undefined values
        if (normalizedValue === undefined) {
          actualLogger.warning(`Could not determine normalized value for entity ${i}, question ${question.id}`);
          continue;
        }

        // Invert if needed
        let isPro = normalizedValue > 0;
        if (question.type === QUESTION_TYPE.SingleChoiceOrdinal && invertProsAndCons) {
          isPro = !isPro;
        }

        // Add to the correct list
        if (isPro) {
          prosComments.push(vaaComment);
        } else {
          consComments.push(vaaComment);
        }
        break;
      }

      case QUESTION_TYPE.SingleChoiceCategorical: {
        const categoricalQuestion = question as SingleChoiceCategoricalQuestion;
        const choiceId = answer.value as Id;

        // For categorical questions, use function ensureValue to validate the choice
        // The actual grouping is done by the choiceId from the answer's value
        try {
          if (isMissingValue(categoricalQuestion.ensureValue(choiceId))) {
            continue;
          }
        } catch (error) {
          actualLogger.warning(
            `Skipping invalid answer for entity ${i}, question ${question.id}: ${error instanceof Error ? error.message : error}`
          );
          continue;
        }

        if (!commentsByChoice.has(choiceId)) {
          commentsByChoice.set(choiceId, []);
        }
        commentsByChoice.get(choiceId)!.push(vaaComment);
        break;
      }
    }
  }

  const groups: Array<CommentGroup> = [];
  if (prosComments.length > 0) {
    groups.push({ type: 'pro', comments: prosComments });
  }
  if (consComments.length > 0) {
    groups.push({ type: 'con', comments: consComments });
  }
  for (const [choiceId, comments] of commentsByChoice.entries()) {
    groups.push({ type: 'categoricalChoice', choiceId, comments });
  }

  // Check comment group sizes and issue warnings if necessary, and truncate if needed
  if (maxCommentsPerGroup !== undefined) {
    for (const group of groups) {
      const groupDescription =
        group.type === 'categoricalChoice' ? `for choice ${String(group.choiceId)}` : `for ${group.type} arguments`;

      if (group.comments.length < COMMENT_PROCESSING.MIN_COMMENTS_THRESHOLD) {
        actualLogger.warning(
          `Only ${group.comments.length} comments for question "${question.name}" (${groupDescription}). The results may not be meaningful.`
        );
      }
      if (group.comments.length > maxCommentsPerGroup) {
        actualLogger.warning(
          `Too many comments for question "${question.name}". Truncating from ${group.comments.length} to ${maxCommentsPerGroup} (${groupDescription}).`
        );
        group.comments = group.comments.slice(0, maxCommentsPerGroup);
      }
    }
  }

  return groups;
}
