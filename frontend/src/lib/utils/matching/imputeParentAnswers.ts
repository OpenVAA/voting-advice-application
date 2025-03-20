import {
  type Answer,
  type AnyNominationVariant,
  type AnyQuestionVariant,
  type FactionNomination,
  NumberQuestion,
  OrganizationNomination,
  SingleChoiceCategoricalQuestion,
  SingleChoiceOrdinalQuestion
} from '@openvaa/data';
import { Match } from '@openvaa/matching';
import { logDebugError } from '$lib/utils/logger';
import { MatchingProxy } from './imputeParentAnswers.type';
import { median } from './median';
import { mode } from './mode';
import type { AnswerDict, Id } from '@openvaa/core';

/**
 * Impute the answers for the provided `Nomination`s from their child `Nomination`s.
 * @param nominations - The array of `Nomination`s to impute answers for. Note they will be edited in place!
 * @param questions - The array of `Question`s to impute answers to
 * @returns an array of `MatchingProxy`es for each `Nomination` with the imputed answers
 */
export function imputeParentAnswers<TNomination extends OrganizationNomination | FactionNomination>({
  nominations,
  questions
}: {
  nominations: Array<TNomination>;
  questions: Array<AnyQuestionVariant>;
}): Array<MatchingProxy<TNomination>> {
  // The base for proxy answers
  const proxyAnswers: Array<AnswerDict> = nominations.map((n) => structuredClone(n.answers ?? {}));

  // Build the output
  function buildProxies(): Array<MatchingProxy<TNomination>> {
    const proxies: Array<MatchingProxy<TNomination>> = [];
    for (let i = 0; i < nominations.length; i++) proxies.push(new MatchingProxy(nominations[i], proxyAnswers[i]));
    return proxies;
  }

  const matchableQuestions = questions.filter((q) => q.isMatchable);
  if (matchableQuestions.length === 0) return buildProxies();

  for (let i = 0; i < nominations.length; i++) {
    const parent = nominations[i];
    const children =
      parent instanceof OrganizationNomination && parent.hasFactions
        ? parent.factionNominations
        : parent.candidateNominations;
    if (children.length === 0) continue;

    // Only impute the answer if it's missing
    // NB. If we enable different imputation methods, we should overwrite answers imputed with a different method
    const unansweredQuestions = matchableQuestions.filter((q) => parent.entity.getAnswer(q) == null);
    if (unansweredQuestions.length === 0) continue;

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

      // Store the imputed answer
      if (value != null) {
        proxyAnswers[i][question.id] = {
          value: value
        } as Answer<typeof value>;
      }
    }
  }

  return buildProxies();
}

/**
 * Unwrap a proxied `Match`.
 */
export function unwrapProxiedMatch<TNomination extends AnyNominationVariant>({
  distance,
  subMatches,
  target: proxy
}: Match<MatchingProxy<TNomination>>): Match<TNomination> {
  return new Match({ distance, target: proxy.target, subMatches });
}
