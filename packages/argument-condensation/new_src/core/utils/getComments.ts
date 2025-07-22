import { type HasAnswers, type Id, isMissingValue } from '@openvaa/core';
import {
  type Answer,
  type BooleanQuestion,
  QUESTION_TYPE,
  type SingleChoiceCategoricalQuestion,
  type SingleChoiceOrdinalQuestion
} from '@openvaa/data';
import type { CommentGroup, CommentGroupingOptions } from '../types/api/commentGroup';
import type { SupportedQuestion } from '../types/base/supportedQuestion';
import type { VAAComment } from '../types/condensation/condensationInput';

/**
 * Transform repository entities to grouped VAAComments for condensation in a single pass.
 * Groups comments based on their answer values and question type.
 * Uses the question's own normalization logic for validation.
 */
export function getComments(
  question: SupportedQuestion,
  entities: Array<HasAnswers>,
  options: CommentGroupingOptions = {}
): Array<CommentGroup> {
  const { invertProsAndCons = false } = options;

  // Final group containers
  const prosComments: Array<VAAComment> = [];
  const consComments: Array<VAAComment> = [];
  const commentsByChoice = new Map<Id, Array<VAAComment>>();

  // Single loop through entities
  for (const [i, entity] of entities.entries()) {
    // Cast question and answer to specific types for normalizeValue typing
    let answer: Answer<boolean | string>;
    let normalizedValue: number | undefined;

    // Handle different question types differently
    switch (question.type) {
      case QUESTION_TYPE.Boolean: {
        const boolQuestion = question as BooleanQuestion;
        const boolAnswer = entity.answers[question.id] as Answer<boolean>;
        if (!boolAnswer?.info?.trim()) continue; // If no info, skip
        answer = boolAnswer;

        try {
          const normalized = boolQuestion.normalizeValue(boolAnswer.value);
          if (isMissingValue(normalized)) continue;
          normalizedValue = Array.isArray(normalized) ? normalized[0] : normalized;
        } catch (error) {
          console.warn(`Skipping invalid answer for entity ${i}, question ${question.id}:`, error);
          continue;
        }
        break;
      }
      case QUESTION_TYPE.SingleChoiceOrdinal: {
        const ordinalQuestion = question as SingleChoiceOrdinalQuestion;
        const ordinalAnswer = entity.answers[question.id] as Answer<string>;
        if (!ordinalAnswer?.info?.trim()) continue; // If no info, skip
        answer = ordinalAnswer;

        try {
          const normalized = ordinalQuestion.normalizeValue(ordinalAnswer.value);
          if (isMissingValue(normalized)) continue;
          normalizedValue = Array.isArray(normalized) ? normalized[0] : normalized;
        } catch (error) {
          console.warn(`Skipping invalid answer for entity ${i}, question ${question.id}:`, error);
          continue;
        }
        break;
      }
      case QUESTION_TYPE.SingleChoiceCategorical: {
        const categoricalQuestion = question as SingleChoiceCategoricalQuestion;
        const categoricalAnswer = entity.answers[question.id] as Answer<string>;
        if (!categoricalAnswer?.info?.trim()) continue; // If no info, skip
        answer = categoricalAnswer;

        try {
          if (isMissingValue(categoricalQuestion.normalizeValue(categoricalAnswer.value))) continue;
        } catch (error) {
          console.warn(`Skipping invalid answer for entity ${i}, question ${question.id}:`, error);
          continue;
        }
        break;
      }
    }

    // Prefer a real ID, fallback to index.
    const entityId = (entity as { id?: Id }).id ?? `entity_index_${i}`; // TODO: Does it even make sense to use an ID?

    // Create the VAAComment object used in the condensation package
    const vaaComment: VAAComment = {
      id: `${entityId}_${question.id}`,
      candidateID: entityId,
      candidateAnswer: String(answer.value ?? ''),
      text: answer.info as string
    };

    // Add the validated comment to the correct group
    // TODO: Use limits from options & other kinds of logic for which input comments to use
    if (question.type === QUESTION_TYPE.Boolean || question.type === QUESTION_TYPE.SingleChoiceOrdinal) {
      if (normalizedValue === undefined) {
        console.warn('Missing normalized value for boolean/ordinal comment');
        continue;
      }

      if (normalizedValue === 0.5) {
        continue; // Ignore neutral/midpoint values for ordinal scales
      }

      const isPro = normalizedValue > 0.5;

      // The inversion flag should only apply to ordinal questions with a reversed scale.
      let classification = isPro;
      if (question.type === QUESTION_TYPE.SingleChoiceOrdinal && invertProsAndCons) {
        classification = !isPro;
      }

      if (classification) {
        prosComments.push(vaaComment);
      } else {
        consComments.push(vaaComment);
      }
    } else if (question.type === QUESTION_TYPE.SingleChoiceCategorical) {
      const choiceId = answer.value as Id;
      if (!commentsByChoice.has(choiceId)) {
        commentsByChoice.set(choiceId, []);
      }
      commentsByChoice.get(choiceId)!.push(vaaComment);
    }
  }

  // Assemble the CommentGroup array from the populated comment groups
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

  return groups;
}
