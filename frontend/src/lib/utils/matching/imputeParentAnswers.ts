import {
  type Answer,
  type AnyQuestionVariant,
  type FactionNomination,
  NumberQuestion,
  OrganizationNomination,
  SingleChoiceCategoricalQuestion,
  SingleChoiceOrdinalQuestion
} from '@openvaa/data';
import { logDebugError } from '$lib/utils/logger';
import { median } from './median';
import { mode } from './mode';
import type { Id } from '@openvaa/core';

/**
 * Impute the answers **in place** for the provided `Nomination`s from their child `Nomination`s.
 * @param nominations - The array of `Nomination`s to impute answers for. Note they will be edited in place!
 * @param questions - The array of `Question`s to impute answers to
 */
export function imputeParentAnswers({
  nominations,
  questions
}: {
  nominations: Array<OrganizationNomination | FactionNomination>;
  questions: Array<AnyQuestionVariant>;
}): void {
  const matchableQuestions = questions.filter((q) => q.isMatchable);
  if (matchableQuestions.length === 0) return;

  for (const parent of nominations) {
    const children =
      parent instanceof OrganizationNomination && parent.hasFactions
        ? parent.factionNominations
        : parent.candidateNominations;
    if (children.length === 0) continue;

    // Only impute the answer if it's missing
    // NB. If we enable different imputation methods, we should overwrite answers imputed with a different method
    const unansweredQuestions = matchableQuestions.filter((q) => parent.entity.getAnswer(q) == null);
    if (unansweredQuestions.length === 0) continue;

    // NB. We need to directly edit the object data
    parent.entity.data.answers ??= {};

    for (const question of unansweredQuestions) {
      const answers = children.map((c) => c.entity.getAnswer(question)?.value).filter((v) => v != null);
      if (answers.length === 0) continue;

      // Impute the answer based on the question type
      let value: Id | number | undefined;

      try {
        // 1. Ordinal questions use median (assuming the choices are in the correct order)
        // NB. We do not consider the possible uneven spacing of the choices’ normalizedValues
        // NB. In case of ties, the first encountered choice is used
        if (question instanceof SingleChoiceOrdinalQuestion) {
          const choiceIds = question.choices.map((c) => c.id);
          const indexAnswers = answers.map((a) => choiceIds.indexOf(a as Id)).filter((i) => i >= 0);
          const imputedIndex =
            indexAnswers.length > 0 ? median(indexAnswers, { returnFirstWhenTied: true }) : undefined;
          if (imputedIndex != null) value = question.choices[imputedIndex].id;
          // 2. Categorical questions use mode
          // NB. In case of draws, the first encountered choice is used
        } else if (question instanceof SingleChoiceCategoricalQuestion) {
          value = mode(answers as Array<Id>);
          // 3. Number questions use median
          // NB. An option to use mean could be provided
        } else if (question instanceof NumberQuestion) {
          value = median(answers.filter((v) => typeof v === 'number'));
        }
        // TODO: For preference order questions, use the Borda count (https://en.wikipedia.org/wiki/Borda_count)
      } catch (e) {
        logDebugError(`Matching.imputeParentAnswers: Error imputing answer for question ${question.id}:`, e);
        continue;
      }

      // Store the imputed answer and the imputation method
      // NB. We need to directly edit the object data!
      if (value != null)
        parent.entity.data.answers[question.id] = {
          imputed: 'impute',
          value: value
        } as Answer<typeof value>;
    }
  }
}
