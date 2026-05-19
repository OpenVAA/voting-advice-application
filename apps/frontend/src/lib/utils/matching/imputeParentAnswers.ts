import { isObjectType, OBJECT_TYPE } from '@openvaa/data';
import { Match } from '@openvaa/matching';
import { logDebugError } from '$lib/utils/logger';
import { MatchingProxy } from './imputeParentAnswers.type';
import { median } from './median';
import { mode } from './mode';
import type { AnswerDict, Id } from '@openvaa/core';
import type {
  AllianceNomination,
  Answer,
  AnyNominationVariant,
  AnyQuestionVariant,
  FactionNomination,
  OrganizationNomination
} from '@openvaa/data';

/**
 * Impute the answers for the provided `Nomination`s from their child `Nomination`s.
 *
 * # Cascading-proxy pattern (Phase 69)
 *
 * Two-pass cascade:
 *   - **Pass 1 (existing):** candidate-noms (children) → organization/faction-noms
 *     (parents). Output: `MatchingProxy<OrganizationNomination | FactionNomination>`
 *     per parent.
 *   - **Pass 2 (Phase 69):** organization-noms (children) → alliance-noms (parents).
 *     Reads child answers from the Pass-1 proxy map (`childProxies` arg) instead of
 *     `child.entity.getAnswer(...)` because alliance children (organization-noms)
 *     typically don't own answers — only their candidates do.
 *
 * # Why proxies, not entity writes
 *
 * The original implementation could have written imputed values back to the parent
 * entity via `entity.setAnswer()`. That approach (a) leaks imputed values into other
 * read paths (filters, drawers, info questions) and (b) is non-reversible. The proxy
 * pattern keeps imputation scoped to the matching pipeline only — `algorithm.match()`
 * accepts proxies directly, and after matching is complete the proxies are discarded.
 *
 * # Why optional childProxies
 *
 * Backward-compat: when `childProxies` is undefined, the function reads child answers
 * from `child.entity.getAnswer(...)` exactly as it did pre-Phase-69 — output is
 * byte-identical for organization + faction parents. Callers only pass `childProxies`
 * when they want to compose passes (e.g. matchStore Pass 2 for alliances).
 *
 * # Org-first invariant
 *
 * `matchStore.svelte.ts` MUST run the Organization branch before the Alliance branch
 * within each election iteration so the org proxies are available when alliance-pass
 * runs. The sequential for...of loop in matchStore documents this invariant.
 *
 * # Future refactor
 *
 * The broader imputation-paradigm refactor (per-entity-type matching method,
 * separation of imputation strategy from the matching loop) is captured in the
 * pending todo `2026-05-09-rewrite-parent-answer-imputation.md`.
 *
 * @param nominations - The parent-entity nominations to impute answers for.
 * @param questions - The question pool to consider; only matchable opinion questions are imputed.
 * @param childProxies - Optional map of pre-imputed proxy answers, keyed by child nomination id. When a child has a proxy in this map, its `proxy.answers[questionId]?.value` is read instead of `child.entity.getAnswer(question)?.value`. Enables Pass 2 cascading.
 * @returns An array of `MatchingProxy<TNomination>` — one per input nomination, with imputed answers attached.
 */
export function imputeParentAnswers<
  TNomination extends OrganizationNomination | FactionNomination | AllianceNomination
>({
  nominations,
  questions,
  childProxies
}: {
  nominations: Array<TNomination>;
  questions: Array<AnyQuestionVariant>;
  childProxies?: Map<Id, MatchingProxy<AnyNominationVariant>>;
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
    let children: ReadonlyArray<AnyNominationVariant>;
    if (isObjectType(parent, OBJECT_TYPE.AllianceNomination)) {
      children = parent.organizationNominations;
    } else if (isObjectType(parent, OBJECT_TYPE.OrganizationNomination) && parent.hasFactions) {
      children = parent.factionNominations;
    } else {
      children = (parent as OrganizationNomination | FactionNomination).candidateNominations;
    }
    if (children.length === 0) continue;

    // Only impute the answer if it's missing
    // NB. If we enable different imputation methods, we should overwrite answers imputed with a different method
    const unansweredQuestions = matchableQuestions.filter((q) => parent.entity.getAnswer(q) == null);
    if (unansweredQuestions.length === 0) continue;

    for (const question of unansweredQuestions) {
      const answers = children
        .map((c) => {
          const proxy = childProxies?.get(c.id);
          if (proxy) return proxy.answers[question.id]?.value;
          return c.entity.getAnswer(question)?.value;
        })
        .filter((v) => v != null);
      if (answers.length === 0) continue;

      // Impute the answer based on the question type
      let value: Id | number | undefined;

      try {
        // 1. Ordinal questions use median (assuming the choices are in the correct order)
        // NB. We do not consider the possible uneven spacing of the choices’ normalizedValues
        // NB. In case of ties, the first encountered choice is used
        if (isObjectType(question, OBJECT_TYPE.SingleChoiceOrdinalQuestion)) {
          const choiceIds = question.choices.map((c) => c.id);
          const indexAnswers = answers.map((a) => choiceIds.indexOf(a as Id)).filter((i) => i >= 0);
          const imputedIndex =
            indexAnswers.length > 0 ? median(indexAnswers, { returnFirstWhenTied: true }) : undefined;
          if (imputedIndex != null) value = question.choices[imputedIndex].id;
          // 2. Categorical questions use mode
          // NB. In case of draws, the first encountered choice is used
        } else if (isObjectType(question, OBJECT_TYPE.SingleChoiceCategoricalQuestion)) {
          value = mode(answers as Array<Id>);
          // 3. Number questions use median
          // NB. An option to use mean could be provided
        } else if (isObjectType(question, OBJECT_TYPE.NumberQuestion)) {
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
