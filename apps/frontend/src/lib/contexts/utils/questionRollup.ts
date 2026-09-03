import { QUESTION_CATEGORY_TYPE } from '@openvaa/data';
import { error } from '@sveltejs/kit';
import type { Id } from '@openvaa/core';
import type { Constituency, Election, EntityType, QuestionCategoryType } from '@openvaa/data';

/**
 * Roll a data root's question categories up into the four collections both orchestrator contexts need: the informational and opinion category groups, and the flattened question list for each group.
 *
 * see phase 159, requirement REVIEW-CMP-05. This logic was written twice — once in `candidateContext.svelte.ts` and once in `voterContext.svelte.ts` — and neither copy recorded that the two were deliberately different rather than accidentally divergent. The differences are exactly three, and this module PARAMETERISES all three rather than collapsing them:
 *
 * 1. **Entity-type scope.** The candidate app scopes the rollup to `ENTITY_TYPE.Candidate` and must pass that scope into BOTH `appliesTo(...)` and `getApplicableQuestions(...)`; the voter app passes no scope at all. Passing it to only the first call would still yield a plausible category list while widening the question set past its entity scope, so the scope is built once here and reused for every call.
 * 2. **Question filter.** The voter app drops questions flagged hidden, from BOTH the informational and the opinion list; the candidate app filters nothing. The predicate is supplied by the caller because what counts as hidden is app-shaped custom data, not a property of the rollup.
 * 3. **Question blocks.** Deliberately NOT here. The candidate app builds blocks from every opinion category inside the same effect; the voter app builds them in a separate effect, filtered by the voter's selected category ids and reordered around a first-question id. Sharing that would produce a parameterised branch rather than shared logic, so each context keeps its own block computation.
 *
 * ── The `dataRoot` contract (LANDMINE) ───────────────────────────────────────
 * This module takes the data root BY VALUE and is a plain, synchronous, rune-free function with no module-level mutable state — so two context classes calling it in the same tick cannot interleave, and neither call can observe the other's intermediate state. That is deliberate, and it is the whole safety property of the extraction.
 *
 * `DataRoot` is IDENTITY-STABLE: its reference never changes and its only reactive signal is a private `#version` counter bumped on `DataRoot.update()`. The caller must therefore read `this.#dataRoot` INSIDE its own effect body — inside the tracking scope — and hand the resulting value here. Binding the accessor to an intermediate derived alias, or handing this function a `() => this.#dataRoot` thunk it would invoke outside any tracking scope, breaks the version dependency: the consumer keeps its empty pre-mount snapshot on cold or direct-URL entry, silently, with no error. Warm entry masks it because the data is already present before the read first happens. See CLAUDE.md § Context Destructuring Rule (the `dataRoot` version-bridge carve-out), `.planning/spikes/024-derived-alias-stable-ref-skip/README.md`, and the committed source scan in `contexts/tests/noDataRootDerivedAlias.test.ts`.
 *
 * The rune names are written without their leading sigil throughout this header on purpose: an acceptance scan asserts this file contains no rune, and a doc comment that spells one would make that scan meaningless.
 */

/** The applicability targets handed to both category calls. Structurally a `FilterTargets`, narrowed to the three fields the rollup actually sets. */
export type QuestionRollupTargets = {
  elections: Array<Election>;
  constituencies: Array<Constituency>;
  entityType?: EntityType;
};

/** The minimal question surface the rollup reads: only the matchability flag the opinion guard tests. */
export type RollupQuestion = {
  readonly isMatchable: boolean;
};

/** The minimal category surface the rollup reads. The real `QuestionCategory` satisfies it structurally, and so can a plain test fixture. */
export type RollupCategory = {
  readonly id: Id;
  readonly type: QuestionCategoryType;
  appliesTo(targets: QuestionRollupTargets): boolean;
  getApplicableQuestions(targets: QuestionRollupTargets): ReadonlyArray<RollupQuestion>;
};

/** The question type a given category collection yields, so the caller's concrete `AnyQuestionVariant` flows through instead of widening to `RollupQuestion`. */
type QuestionOf<TCategory extends RollupCategory> = ReturnType<TCategory['getApplicableQuestions']>[number];

/**
 * Split a data root's applicable question categories into their informational and opinion groups and flatten each group's applicable questions.
 *
 * @param dataRoot - The data root, passed BY VALUE from inside the caller's effect body. Never an alias and never a thunk — see the module header.
 * @param elections - The currently selected elections.
 * @param constituencies - The currently selected constituencies.
 * @param entityType - Optional entity-type scope, applied to BOTH the applicability check and the applicable-question lookup. The candidate app passes one; the voter app does not.
 * @param questionFilter - Optional predicate applied to BOTH question kinds. The voter app passes its hidden-question filter; the candidate app passes none.
 * @returns The two category groups and the two question lists. Empty collections, never `undefined`, when the data root holds no categories.
 * @throws A 500 when an opinion category holds a question that is not matchable — the question would otherwise reach the matching algorithm and fail far from its cause.
 */
export function rollUpQuestionCategories<TCategory extends RollupCategory>({
  dataRoot,
  elections,
  constituencies,
  entityType,
  questionFilter
}: {
  dataRoot: { readonly questionCategories?: ReadonlyArray<TCategory> | null };
  elections: Array<Election>;
  constituencies: Array<Constituency>;
  entityType?: EntityType;
  questionFilter?: (question: QuestionOf<TCategory>) => boolean;
}): {
  infoCategories: Array<TCategory>;
  opinionCategories: Array<TCategory>;
  infoQuestions: Array<QuestionOf<TCategory>>;
  opinionQuestions: Array<QuestionOf<TCategory>>;
} {
  // Built once so the entity-type scope cannot reach one call site and miss the other.
  const targets: QuestionRollupTargets = entityType
    ? { elections, constituencies, entityType }
    : { elections, constituencies };

  function applicableQuestions(category: TCategory): Array<QuestionOf<TCategory>> {
    const questions = category.getApplicableQuestions(targets) as ReadonlyArray<QuestionOf<TCategory>>;
    return questionFilter ? questions.filter(questionFilter) : [...questions];
  }

  const applicableCategories =
    dataRoot.questionCategories?.filter((c) => c.appliesTo(targets) && c.getApplicableQuestions(targets).length > 0) ??
    [];

  const infoCategories = applicableCategories.filter((c) => c.type !== QUESTION_CATEGORY_TYPE.Opinion);
  const opinionCategories = applicableCategories.filter((c) => c.type === QUESTION_CATEGORY_TYPE.Opinion);

  const infoQuestions = infoCategories.flatMap(applicableQuestions);
  const opinionQuestions = opinionCategories.flatMap((c) => {
    const questions = applicableQuestions(c);
    if (c.type === QUESTION_CATEGORY_TYPE.Opinion && questions.some((q) => !q.isMatchable))
      error(500, `Some opinion questions in category ${c.id} is not matchable.`);
    return questions;
  });

  return {
    infoCategories: [...infoCategories],
    opinionCategories: [...opinionCategories],
    infoQuestions,
    opinionQuestions
  };
}
