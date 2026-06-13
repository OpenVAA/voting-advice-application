import type { Id } from '@openvaa/core';
import type { AnyQuestionVariant, Constituency, Election, EntityType, QuestionCategory } from '@openvaa/data';
import type { MatchingAlgorithm } from '@openvaa/matching';
import type { AppContext } from '../app';
import type { FilterContext } from '../filter/filterContext.type';
import type { QuestionBlocks } from '../utils/questionBlockState.type';
import type { AnswerStore } from './answerState.type';
import type { FilterTree } from './filters/filterState.svelte';
import type { MatchTree } from './matchState.svelte';

export type VoterContext = AppContext & {
  /**
   * The matching algorithm object used for matching.
   */
  algorithm: MatchingAlgorithm;
  /**
   * The voters `Answer`s to the `Question`s.
   */
  answers: AnswerStore;
  /**
   * Whether `Election`s can be selected.
   */
  electionsSelectable: boolean;
  /**
   * Whether `Constituency`s can be selected.
   */
  constituenciesSelectable: boolean | undefined;
  /**
   * The `Election`s selected by the voter or automatically selected if they can be implied, e.g. when election selection is disabled by the app settings or there is just one election.
   */
  selectedElections: Array<Election>;
  /**
   * The currently-SELECTED election (singular) whose results are being rendered,
   * derived from `page.params.electionTab` (the new route segment introduced in
   * Phase 88 Plan 88-02). When the route param is absent AND there's exactly
   * one available election, falls back to `selectedElections[0]`. Returns
   * `undefined` when the route param is absent AND there are 0 or 2+ available
   * elections (the picker shape) — OR when the route param names an election
   * not present in `selectedElections` (a stale/invalid `electionTab`; the
   * server-side guard at `(voters)/(located)/results/[[electionTab]]/+layout.ts`
   * will normally have redirected before this getter is reached on the same
   * render, so this case is a defensive fall-through).
   *
   * SEMANTIC DISSOCIATION (NAME-DISJOINT): `selectedElections` (existing field
   * above) returns the AVAILABLE array (zero-or-more) sourced from the
   * SEARCH-side `?electionId=…` / `electionId[N]=…` surface;
   * `currentResultsElection` (this field) returns the SELECTED singular
   * sourced from the ROUTE-side `page.params.electionTab` surface. The two
   * keys (`electionId` vs `electionTab`) are literally different identifiers
   * throughout the codebase — they never alias.
   *
   * Read via `ctx.currentResultsElection` per the CLAUDE.md
   * Context Destructuring Rule (Svelte 5) — this is a reactive accessor and
   * MUST NOT be destructured out of the context object (the getter would be
   * invoked ONCE at component-init time and the captured value would not
   * react to subsequent URL changes).
   */
  currentResultsElection: Election | undefined;
  /**
   * The singular `EntityType` implied for the currently active results
   * election. URL-first: when `page.params.entityTab` names a plural
   * (`candidates` / `organizations` / `alliances`) that is available for
   * `currentResultsElection`, the mapped singular wins; otherwise this
   * default-picks the first available entity type from the matches tree.
   * Returns `undefined` when there is no active election OR matches haven't
   * been built yet for that election.
   *
   * Added by the Phase 88 Plan 88-02 follow-up that broke the route-shape
   * redirect loop: the previous behavior force-filled `/candidates` into the
   * results URL whenever `entityTab` was absent (`+layout.ts` GUARD 2 / GUARD
   * 4 + the leaf coupling-guard + `buildListRoute`), and those force-fills
   * combined to bounce navigation when consumers re-emitted same-shape URLs
   * without the segment. Moving the implied-tab semantics onto voterContext
   * means the URL can carry `entityTab` ONLY when the user has explicitly
   * selected one, and consumers (filterContext, layout.svelte's
   * `activeEntityType`) read the implied value uniformly.
   *
   * Read via `ctx.currentResultsEntityType` per the CLAUDE.md Context
   * Destructuring Rule (Svelte 5) — reactive accessor; MUST NOT be
   * destructured.
   */
  currentResultsEntityType: EntityType | undefined;
  /**
   * The `Constituency`s selected by the user or automatically selected if they can be implied, e.g. when all selected elections have only one constituency.
   */
  selectedConstituencies: Array<Constituency>;
  /**
   * Whether there are enough `Answer`s to compute matches.
   */
  resultsAvailable: boolean;
  /**
   * A utility value detailing whether any nominations are available for the selected `Election`s.
   */
  nominationsAvailable: { [selectedElectionId: Id]: boolean };
  /**
   * The matched `Nomination`s for each `Election` and `EntityType`.
   */
  matches: MatchTree;
  /**
   * The currently active `EntityFilter`s for each `Election` and `EntityType`.
   */
  entityFilters: FilterTree;
  /**
   * The scoped `FilterContext` for the current (`electionId`, `entityTab`) tuple.
   * Bundled through voterContext for ergonomic consumption from the voter flow UI;
   * also directly accessible via `getFilterContext()` for the future LLM chat
   * integration (Phase 62 D-05, D-06). Same Symbol-keyed instance both ways.
   */
  filterContext: FilterContext;
  /**
   * The non-opinion `QuestionCategory`s applicable to the current `Election`s and `Constituency`s.
   * NB. When accessing the `Question`s in the categories, use the `getApplicableQuestions({election, constituency})` method.
   */
  infoQuestionCategories: Array<QuestionCategory>;
  /**
   * The non-opinion `Question`s applicable to the current `Election`s and `Constituency`s.
   */
  infoQuestions: Array<AnyQuestionVariant>;
  /**
   * The matching `QuestionCategory`s applicable to the current `Election`s and `Constituency`s.
   * NB. When accessing the `Question`s in the categories, use the `getApplicableQuestions({election, constituency})` method.
   */
  opinionQuestionCategories: Array<QuestionCategory>;
  /**
   * The matching `Question`s applicable to the current `Election`s and `Constituency`s.
   */
  opinionQuestions: Array<AnyQuestionVariant>;
  /**
   * The `Id`s of the opinion `QuestionCategory`s the user has selected for answering.
   */
  selectedQuestionCategoryIds: Array<Id>;
  /**
   * The first question id if not the default one. This may be set by a query parameter on the `.../[questionId]/` route.
   */
  firstQuestionId: Id | null;
  /**
   * The `Question`s in the selected `QuestionCategory`s as well as some utility methods.
   */
  selectedQuestionBlocks: QuestionBlocks;
  /**
   * Reset all saved voter data, except privacy preferences and survey status.
   */
  resetVoterData: () => void;
};
