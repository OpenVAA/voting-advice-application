import { log } from '@openvaa/app-shared';
import { DISTANCE_METRIC, MatchingAlgorithm, MISSING_VALUE_METHOD } from '@openvaa/matching';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext, untrack } from 'svelte';
import { page } from '$app/state';
import { getImpliedConstituencyIds, getImpliedElectionIds } from '$lib/routes';
import { answerState } from './answerState.svelte';
import { countAnswers } from './countAnswers';
import { filterState } from './filters/filterState.svelte';
import { matchState } from './matchState.svelte';
import { nominationAndQuestionState } from './nominationAndQuestionState.svelte';
import { getAppContext } from '../../contexts/app';
import { getFilterContext, initFilterContext } from '../filter';
import { inheritContextMembers } from '../utils/inheritContextMembers';
import { paramState } from '../utils/paramState.svelte';
import { sessionStorageState } from '../utils/persistedState.svelte';
import { rollUpQuestionCategories } from '../utils/questionRollup';
import type { CustomData } from '@openvaa/app-shared';
import type { Id } from '@openvaa/core';
import type { AnyQuestionVariant, Constituency, Election, EntityType, QuestionCategory } from '@openvaa/data';
import type { AppContext } from '../app';
import type { QuestionBlocks } from '../utils/questionBlockState.type';
import type { VoterContext } from './voterContext.type';

const CONTEXT_KEY = Symbol();

/**
 * The voter context (orchestrator) as a Svelte 5 CLASS (`VoterContextProvider`).
 * Constructed via `new VoterContextProvider()` inside `initVoterContext()`, at component-init time.
 *
 * ── Shape decision ──────────────────────────────────────────────────────────
 * NO consumer spreads `voterContext` (`{ ...voterContext }` → zero hits). So its OWN members are exposed as plain PROTOTYPE GETTERS (the natural class shape) — voterContext does NOT need the own-enumerable discipline that AppContextProvider requires. The own-enumerable concern applies ONLY to the INHERITED appContext members, which arrive already own-enumerable from the AppContextProvider instance and are forwarded onto this instance rather than spread into it.
 *
 * ── Field-init order ─────────────────────────────────────────────────────────
 * The 4 sub-store producers (#answers / #nominationsAndQuestions / #matches / #entityFilters), the 5 `$effect` blocks, and the `$derived.by` projections that read a producer instance are installed in the CONSTRUCTOR, AFTER the `$state` / handle / producer fields they read are assigned — the same ordering rule as appContext and filterContext. They are legal in-constructor because voterContext is constructed during component init, an effect context.
 *
 * @internal — test seam — do not construct directly; requires effect context; use `initVoterContext()`. Calling `new VoterContextProvider()` outside `initVoterContext()` bypasses the `CONTEXT_KEY` double-init guard, will throw `effect_orphan` outside a component `<script>` or `$effect.root`, and installs `initFilterContext` side effects without the single-init protection.
 * @throws When constructed outside a Svelte effect context (effect_orphan).
 * @throws When `initFilterContext` has already been called (double-init guard).
 */
export class VoterContextProvider implements VoterContext {
  ////////////////////////////////////////////////////////////
  // Private $state backings + persisted/param handles
  ////////////////////////////////////////////////////////////

  // Push-based `$state` + `$effect` mirror — the voter-side counterpart of the same shape in candidateContext.
  // A `$derived.by` pull-chain here would capture initial empty values whenever a consumer destructured the context property: reads via the destructured local are not live reactive sources, so updates after data load would not propagate. `$state` reads through context getters propagate correctly. Side effects (goto on stale id) live naturally inside `$effect`, not inside a derivation.
  #selectedElections = $state<Array<Election>>([]);
  #selectedConstituencies = $state<Array<Constituency>>([]);

  // A single push-based `$effect` writes these `$state` mirrors, rather than a helper-store pull-chain (`questionCategoryState` / `questionState` / `questionBlockState`). Those helper-store derivations are declared in another module's scope and do not propagate invalidation across the function-accessor boundary on the voter side — the same root-cause class as the candidate-side destructure trap. The behaviour is equivalent; the helpers remain available for any non-context consumers.
  #infoQuestionCategories = $state<Array<QuestionCategory>>([]);
  #opinionQuestionCategories = $state<Array<QuestionCategory>>([]);
  #infoQuestions = $state<Array<AnyQuestionVariant>>([]);
  #opinionQuestions = $state<Array<AnyQuestionVariant>>([]);
  #selectedQuestionBlocks = $state<QuestionBlocks>({
    blocks: [],
    get questions() {
      return [];
    },
    getByCategory: () => undefined,
    getByQuestion: () => undefined
  });

  // Pure $state, no sessionStorage.
  // `bind:group` on a getter/setter context accessor backed by `fromStore(sessionStorageWritable)` intermittently fails to propagate writes (a known Svelte 5 binding pitfall), hence pure $state; session-only; default-all-checked seeded here rather than in the page's onMount so the counter never renders the transient 0 state.
  #selectedQuestionCategoryIds = $state<Array<Id>>([]);
  #hasSeededCategorySelection = $state(false);

  #firstQuestionId = sessionStorageState('voterContext-firstQuestionId', null as Id | null);

  // Param-based collection stores (class instances; read via `.value`).
  #electionId = paramState('electionId');
  #constituencyId = paramState('constituencyId');

  /**
   * The matching algorithm object used for matching. Stable plain field (it is exposed on the surface as the `algorithm` member; not spread, so a plain field is fine).
   */
  algorithm = new MatchingAlgorithm({
    distanceMetric: DISTANCE_METRIC.Manhattan,
    missingValueOptions: {
      method: MISSING_VALUE_METHOD.RelativeMaximum
    }
  });

  ////////////////////////////////////////////////////////////
  // Inherited appContext + STABLE refs (field initializers — they run BEFORE the $derived/producer field initializers below in declaration order, so those can read them; the appContext members are reproduced via `Object.assign(this, this.#appContext)` in the constructor — see below).
  ////////////////////////////////////////////////////////////

  #appContext = getAppContext();

  // The canonical reactive accessors from appContext. These are BARE reactive accessors — `this.#appContext.appSettings` etc. read the live value directly, no `.current`. They MUST be re-read each access to stay reactive, so they are private GETTERS, not value-captured fields: a field initializer `#appSettings = this.#appContext.appSettings` would snapshot the value once at construction and lose reactivity. The getters re-invoke `this.#appContext.X` inside the tracking scope on every read.)
  get #appSettings(): AppContext['appSettings'] {
    return this.#appContext.appSettings;
  }
  get #locale(): AppContext['locale'] {
    return this.#appContext.locale;
  }
  get #dataRoot(): AppContext['dataRoot'] {
    return this.#appContext.dataRoot;
  }
  #t = this.#appContext.t;

  ////////////////////////////////////////////////////////////
  // Sub-store PRODUCER instances (field initializers in declaration order — they read #appSettings/#dataRoot/#answers above; the getter-args are lazy thunks, so producer ordering is safe). Declared before the $derived fields that read them (#resultsAvailable/#nominationsAvailable/#currentResultsEntityType) — those bodies are lazy too.
  ////////////////////////////////////////////////////////////

  #answers = answerState({ startEvent: this.#appContext.startEvent });

  // Matching and filtering depend on the available nominations and questions, for which we use a utility store
  #nominationsAndQuestions = nominationAndQuestionState({
    constituencies: () => this.#selectedConstituencies,
    dataRoot: () => this.#dataRoot,
    elections: () => this.#selectedElections,
    entityTypes: () => this.#entityTypes,
    hideIfMissingAnswers: () => this.#hideIfMissingAnswers
  });

  #matches = matchState({
    algorithm: this.algorithm,
    answers: this.#answers,
    nominationsAndQuestions: () => this.#nominationsAndQuestions.value,
    minAnswers: () => this.#minAnswers,
    calcSubmatches: () => this.#calcSubmatches,
    parentMatchingMethod: () => this.#parentMatchingMethod
  });

  #entityFilters = filterState({
    nominationsAndQuestions: () => this.#nominationsAndQuestions.value,
    locale: () => this.#locale,
    t: () => this.#t
  });

  ////////////////////////////////////////////////////////////
  // $derived projections (field initializers — bodies are lazy thunks evaluated on first read, so they may reference fields assigned later (e.g. #matches); the reactive-projection-in-$derived rule, the same shape as FilterContextProvider's `#filterGroup`). Read through the prototype getters below.
  ////////////////////////////////////////////////////////////

  // Stores related to selection pages
  #electionsSelectable = $derived(
    !this.#appSettings.elections?.disallowSelection && this.#dataRoot.elections?.length !== 1
  );

  #constituenciesSelectable = $derived(this.#dataRoot.elections?.some((e) => !e.singleConstituency));

  ////////////////////////////////////////////////////////////
  // currentResultsElection
  ////////////////////////////////////////////////////////////
  //
  // Singular SELECTED election whose results page is being rendered, sourced from the NEW route segment `page.params.electionTab`.
  //
  // SEMANTIC DISSOCIATION (NAME-DISJOINT): `selectedElections` is the AVAILABLE-array surface sourced from the SEARCH-side `?electionId=…` persistent search param; `currentResultsElection` is the SELECTED-singular surface sourced from the ROUTE-side `page.params.electionTab` segment. The two keys (`electionId` vs `electionTab`) are literally different identifiers throughout the codebase — they never alias.
  //
  // Implementation choice (Decision Q3): `$derived.by` rather than the push-pattern `$state` + `$effect` mirror used by `selectedElections`. The push-pattern was needed for `selectedElections` because of the silent-fail FK-lookup race (a transient throw during navigation when DataRoot doesn't yet have the election). Here we just lookup against the already-resolved `selectedElections` array — no FK fetch, no race — so the cheap `$derived.by` is sufficient. Reactivity propagates correctly because `page.params.electionTab` is reactive in Svelte 5 (`$app/state`) and `selectedElections` is reactive via `$state`.
  //
  // Fallback chain:
  //   1. Route segment present AND found in available array → that election.
  //   2. Route segment absent AND exactly 1 available → that single election
  //      (mirrors the +layout.svelte single-election fallback).
  //   3. Otherwise (route segment present but stale, OR route segment absent
  //      with 0/2+ available) → `undefined`. The server-side guard at
  //      `(voters)/(located)/results/[[electionTab]]/+layout.ts` will normally have redirected before this derivation runs in the stale case; this just defends against late-arriving updates.
  #currentResultsElection = $derived.by<Election | undefined>(() => {
    const tab = page.params.electionTab;
    if (tab) return this.#selectedElections.find((e) => e.id === tab);
    if (this.#selectedElections.length === 1) return this.#selectedElections[0];
    return undefined;
  });

  #resultsAvailable = $derived.by(() => {
    const settings = this.#appSettings;
    const questions = this.#opinionQuestions;
    const currentAnswers = this.#answers.answers;
    // For results to be available, we need at least the specified number of answers for each election
    if (this.#selectedElections.length === 0) return false;
    return this.#selectedElections.every((e) => {
      const applicableQuestions = questions.filter((q) => q.appliesTo({ elections: e }));
      return (
        countAnswers({ answers: currentAnswers, questions: applicableQuestions }) >= settings.matching.minimumAnswers
      );
    });
  });

  /** The types of entities we show in results */
  #entityTypes = $derived(this.#appSettings.results?.sections ?? []);

  /** The entity types to hide if missing opinion answers */
  #hideIfMissingAnswers = $derived(this.#appSettings.entities?.hideIfMissingAnswers || {});

  #nominationsAvailable = $derived.by(() => {
    const nq = this.#nominationsAndQuestions.value;
    return Object.fromEntries(
      Object.entries(nq).map(([id, contents]) => [
        id,
        Object.values(contents).some(({ nominations }) => nominations.length > 0)
      ])
    );
  });

  #minAnswers = $derived(this.#appSettings.matching.minimumAnswers);

  /** Get the entityTypes whose cardContents include `submatches` */
  #calcSubmatches = $derived.by(() =>
    Object.entries(this.#appSettings.results?.cardContents ?? {})
      .filter(([, value]) => value?.includes('submatches'))
      .map(([type]) => type as EntityType)
  );

  /** The parent entity matching method */
  #parentMatchingMethod = $derived(this.#appSettings.matching?.organizationMatching || 'none');

  // currentResultsEntityType — singular EntityType implied for the active results election. URL-first: when `page.params.entityTab` names a valid plural (matched against the current election's available types) the mapped singular wins. Otherwise, default-pick the first available type for `currentResultsElection`. Returns `undefined` only when there is no active election or its matches tree hasn't been built yet.
  //
  // Why this lives on voterContext (not the route layout):
  //   - Removes the need for `+layout.ts` to force-fill `entityTab` into the URL. Force-filling auto-redirects `/results/{e}` → `/results/{e}/candidates`, which combined with downstream consumers emitting same-shape URLs produces a redirect loop.
  //   - Lets `filterContext` resolve the active FilterGroup even when the URL omits `entityTab`: the scope tuple is implied, not URL-derived.
  //   - Mirrors `currentResultsElection`'s singular-derived-from-URL pattern.
  //
  // Per CLAUDE.md Context Destructuring Rule, consumers MUST read via `ctx.currentResultsEntityType` — never destructure.
  #currentResultsEntityType = $derived.by<EntityType | undefined>(() => {
    if (!this.#currentResultsElection) return undefined;
    const matchesForElection = this.#matches.value[this.#currentResultsElection.id];
    if (!matchesForElection) return undefined;
    const availableTypes = Object.keys(matchesForElection) as Array<EntityType>;
    if (availableTypes.length === 0) return undefined;
    const tab = page.params.entityTab;
    const fromUrl: EntityType | undefined =
      tab === 'candidates'
        ? 'candidate'
        : tab === 'organizations'
          ? 'organization'
          : tab === 'alliances'
            ? 'alliance'
            : undefined;
    if (fromUrl && availableTypes.includes(fromUrl)) return fromUrl;
    return availableTypes[0];
  });

  ////////////////////////////////////////////////////////////
  // Inherited appContext members (declared for `implements VoterContext`; INSTALLED via `Object.assign(this, this.#appContext)` in the constructor from the own-enumerable AppContextProvider instance).
  // Definite-assignment `!`.
  ////////////////////////////////////////////////////////////

  readonly appType!: AppContext['appType'];
  readonly appSettings!: AppContext['appSettings'];
  readonly appCustomization!: AppContext['appCustomization'];
  readonly openFeedbackModal!: AppContext['openFeedbackModal'];
  readonly locale!: AppContext['locale'];
  readonly locales!: AppContext['locales'];
  readonly darkMode!: AppContext['darkMode'];
  readonly getRoute!: AppContext['getRoute'];
  readonly surveyLink!: AppContext['surveyLink'];
  readonly userPreferences!: AppContext['userPreferences'];
  readonly t!: AppContext['t'];
  readonly translate!: AppContext['translate'];
  readonly dataRoot!: AppContext['dataRoot'];
  readonly setDataRoot!: AppContext['setDataRoot'];
  readonly sendTrackingEvent!: AppContext['sendTrackingEvent'];
  readonly startPageview!: AppContext['startPageview'];
  readonly startEvent!: AppContext['startEvent'];
  readonly track!: AppContext['track'];
  readonly submitAllEvents!: AppContext['submitAllEvents'];
  readonly resetAllEvents!: AppContext['resetAllEvents'];
  readonly sendFeedback!: AppContext['sendFeedback'];
  readonly setDataConsent!: AppContext['setDataConsent'];
  readonly setFeedbackStatus!: AppContext['setFeedbackStatus'];
  readonly setSurveyStatus!: AppContext['setSurveyStatus'];
  readonly startFeedbackPopupCountdown!: AppContext['startFeedbackPopupCountdown'];
  readonly startSurveyPopupCountdown!: AppContext['startSurveyPopupCountdown'];
  readonly popupQueue!: AppContext['popupQueue'];

  constructor() {
    ////////////////////////////////////////////////////////////
    // Inheritance from other Contexts
    ////////////////////////////////////////////////////////////
    //
    // Forward appContext INSTEAD of spreading it: appContext members are own-enumerable, so every one can be copied onto this instance. (The stable refs + sub-store producers + $derived projections are field initializers above, which run in declaration order BEFORE this constructor body.)
    //
    // Use inheritContextMembers (NOT Object.assign) so the bare reactive accessors (appSettings / dataRoot / locale) are forwarded as LIVE accessors. Object.assign would snapshot their construction-time value and freeze reactivity for every consumer reading them off this orchestrator.
    inheritContextMembers(this, this.#appContext);

    ////////////////////////////////////////////////////////////
    // Elections and Constituencies push-based $state mirrors
    ////////////////////////////////////////////////////////////

    $effect(() => {
      const dr = this.#dataRoot;
      const settings = this.#appSettings;
      const electionId = this.#electionId.value;
      const constituencyId = this.#constituencyId.value;
      if (!dr.elections.length) {
        if (this.#selectedElections.length !== 0) this.#selectedElections = [];
        return;
      }
      const ids = electionId?.length
        ? electionId
        : getImpliedElectionIds({
            appSettings: settings,
            dataRoot: dr,
            selectedConstituencyIds: constituencyId
          });
      if (!ids?.length) {
        if (this.#selectedElections.length !== 0) this.#selectedElections = [];
        return;
      }
      try {
        const next = ids.map((id) => dr.getElection(id));
        if (!sameRefs(next, this.#selectedElections)) this.#selectedElections = next;
      } catch (e) {
        // DataRoot lookup throws transiently during navigation: when the URL changes the page params arrive on the new route before the loader has finished re-providing the corresponding data. Falling back to a `goto('Elections')` here races with the in-flight navigation and boomerangs the user back to /elections — the silent-fail flake documented at multi-election.spec.ts:173. Clear the local mirror and let the route's `+page.ts` / `+layout.ts` `redirect()` decide whether a redirect is actually needed.
        log.error(`[selectedElections] Error fetching election: ${e}`);
        if (this.#selectedElections.length !== 0) this.#selectedElections = [];
      }
    });

    $effect(() => {
      const dr = this.#dataRoot;
      const constituencyId = this.#constituencyId.value;
      const electionId = this.#electionId.value;
      if (!dr.constituencies.length) {
        if (this.#selectedConstituencies.length !== 0) this.#selectedConstituencies = [];
        return;
      }
      const ids = constituencyId?.length
        ? constituencyId
        : getImpliedConstituencyIds({
            dataRoot: dr,
            selectedElectionIds: electionId
          });
      if (!ids?.length) {
        if (this.#selectedConstituencies.length !== 0) this.#selectedConstituencies = [];
        return;
      }
      try {
        const next = ids.map((id) => dr.getConstituency(id));
        if (!sameRefs(next, this.#selectedConstituencies)) this.#selectedConstituencies = next;
      } catch (e) {
        // See parallel selectedElections catch above — clear the local mirror and let the route loader handle redirects so we don't race the in-flight navigation.
        log.error(`[selectedConstituencies] Error fetching constituency: ${e}`);
        if (this.#selectedConstituencies.length !== 0) this.#selectedConstituencies = [];
      }
    });

    ////////////////////////////////////////////////////////////
    // Questions and QuestionCategories
    ////////////////////////////////////////////////////////////

    // Single $effect computes the entire question chain whenever upstream state (selectedElections / selectedConstituencies / dataRoot) changes.
    $effect(() => {
      const dr = this.#dataRoot;
      const elections = this.#selectedElections;
      const constituencies = this.#selectedConstituencies;
      // `dr` was read above, inside this effect's tracking scope, and is handed to the shared rollup BY VALUE — never as a `$derived` alias and never as a thunk. See `../utils/questionRollup` for why either shape goes stale on cold entry.
      // Voter-app filters out hidden questions (per `questionState` original behavior with appType: 'voter') on BOTH question kinds; the rollup applies the predicate to each. The opinion-question matchability check moved into the rollup unchanged.
      const {
        infoCategories: nextInfoCats,
        opinionCategories: nextOpinionCats,
        infoQuestions: nextInfoQuestions,
        opinionQuestions: nextOpinionQuestions
      } = rollUpQuestionCategories({
        dataRoot: dr,
        elections,
        constituencies,
        questionFilter: (q) => !(q.customData as CustomData['Question'])?.hidden
      });

      this.#infoQuestionCategories = nextInfoCats;
      this.#opinionQuestionCategories = nextOpinionCats;
      this.#infoQuestions = nextInfoQuestions;
      this.#opinionQuestions = nextOpinionQuestions;
    });

    // Seed default-all-checked once opinion categories are available.
    // Guarded with `hasSeededCategorySelection` so voter de-selects are preserved when `_opinionQuestionCategories` later reacts to election/constituency changes (would otherwise clobber the voter's deliberate selection).
    $effect(() => {
      if (this.#hasSeededCategorySelection) return;
      const cats = this.#opinionQuestionCategories;
      if (cats.length === 0) return;
      untrack(() => {
        this.#selectedQuestionCategoryIds = cats.map((c) => c.id);
        this.#hasSeededCategorySelection = true;
      });
    });

    // QuestionBlocks: filtered by the user's selected category ids and ordered optionally by `firstQuestionId`. Mirrors the original `questionBlockState` logic verbatim; written into a `$state` for consumer reactivity.
    $effect(() => {
      const firstId = this.#firstQuestionId.current;
      const allOpinionCats = this.#opinionQuestionCategories;
      const categoryIds = this.#selectedQuestionCategoryIds;
      const elections = this.#selectedElections;
      const constituencies = this.#selectedConstituencies;

      const filteredCats = categoryIds.length
        ? allOpinionCats.filter((c) => categoryIds.includes(c.id))
        : allOpinionCats;
      let blocks = filteredCats
        .map((c) => c.getApplicableQuestions({ elections, constituencies }))
        .filter((b) => b.length > 0);

      if (firstId) {
        const indexOfBlock = blocks.findIndex((b) => b.find((q) => q.id === firstId));
        if (indexOfBlock === -1) {
          log.debug(`Bypassing invalid first question id: ${firstId}.`);
        } else {
          const block = blocks[indexOfBlock];
          const indexInBlock = block.findIndex((q) => q.id === firstId);
          const newFirstBlock = [block.splice(indexInBlock, 1)[0], ...block];
          blocks.splice(indexOfBlock, 1);
          blocks = [newFirstBlock, ...blocks];
        }
      }

      const finalBlocks = blocks;
      this.#selectedQuestionBlocks = {
        blocks: finalBlocks,
        get questions() {
          return finalBlocks.flat();
        },
        getByCategory: ({ id }) => {
          const block = finalBlocks.find((b) => b[0]?.category.id === id);
          if (!block) return undefined;
          return { block, index: finalBlocks.indexOf(block) };
        },
        getByQuestion: ({ id }) => {
          const indexOfBlock = finalBlocks.findIndex((b) => b.find((q) => q.id === id));
          if (indexOfBlock === -1) return undefined;
          const block = finalBlocks[indexOfBlock];
          const index = finalBlocks.flat().findIndex((q) => q.id === id);
          const indexInBlock = block.findIndex((q) => q.id === id);
          if (index === -1 || indexInBlock === -1) return undefined;
          return { block, index, indexInBlock, indexOfBlock };
        }
      };
    });

    ////////////////////////////////////////////////////////////
    // Initialize the dedicated filterContext
    ////////////////////////////////////////////////////////////

    // Initialize the dedicated filterContext using a closure over the just-built FilterTree. It also injects `currentEntityType` so filterContext can resolve its scope tuple via the voterContext-implied entity type, which is why the URL does not have to carry `entityTab` (the route load function does not force-fill it).
    // Single init per voter session — re-init is guarded by initFilterContext() itself (status-500).
    initFilterContext({
      entityFilters: () => this.#entityFilters.value,
      currentEntityType: () => this.#currentResultsEntityType
    });
  }

  ////////////////////////////////////////////////////////////
  // Resetting voter data (arrow field — survives detach as onclick)
  ////////////////////////////////////////////////////////////

  resetVoterData = (): void => {
    this.#answers.reset();
    this.#firstQuestionId.set(null);
    // pure $state assignment + reset the seed-guard so the next render re-seeds default-all-checked via the $effect above.
    this.#selectedQuestionCategoryIds = [];
    this.#hasSeededCategorySelection = false;
  };

  ////////////////////////////////////////////////////////////
  // Surface members (prototype get/set accessors — spread-safe)
  ////////////////////////////////////////////////////////////

  get answers() {
    return this.#answers;
  }
  get constituenciesSelectable() {
    return this.#constituenciesSelectable;
  }
  get currentResultsElection() {
    return this.#currentResultsElection;
  }
  get currentResultsEntityType() {
    return this.#currentResultsEntityType;
  }
  get electionsSelectable() {
    return this.#electionsSelectable;
  }
  get entityFilters() {
    return this.#entityFilters.value;
  }
  /**
   * bundled accessor — delegates to `getFilterContext ` so the same Symbol-keyed context instance is exposed both directly (future LLM chat) and via the voter context (voter-flow UI). Getter delegation avoids capturing a stale reference at construction time.
   */
  get filterContext() {
    return getFilterContext();
  }
  get firstQuestionId() {
    return this.#firstQuestionId.current;
  }
  set firstQuestionId(v) {
    this.#firstQuestionId.set(v);
  }
  get infoQuestionCategories() {
    return this.#infoQuestionCategories;
  }
  get infoQuestions() {
    return this.#infoQuestions;
  }
  get matches() {
    return this.#matches.value;
  }
  get nominationsAvailable() {
    return this.#nominationsAvailable;
  }
  get opinionQuestionCategories() {
    return this.#opinionQuestionCategories;
  }
  get opinionQuestions() {
    return this.#opinionQuestions;
  }
  get resultsAvailable() {
    return this.#resultsAvailable;
  }
  get selectedConstituencies() {
    return this.#selectedConstituencies;
  }
  get selectedElections() {
    return this.#selectedElections;
  }
  get selectedQuestionBlocks() {
    return this.#selectedQuestionBlocks;
  }
  get selectedQuestionCategoryIds() {
    return this.#selectedQuestionCategoryIds;
  }
  set selectedQuestionCategoryIds(v) {
    this.#selectedQuestionCategoryIds = v;
  }
}

export function getVoterContext(): VoterContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getVoterContext() called before initVoterContext()');
  return getContext<VoterContext>(CONTEXT_KEY);
}

/**
 * Initialize and return the context. This must be called before `getGlobalContext()` and cannot be called twice.
 * @returns The context object
 */
export function initVoterContext(): VoterContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initVoterContext() called for a second time');
  return setContext<VoterContext>(CONTEXT_KEY, new VoterContextProvider());
}

// Content-equality short-circuit: every URL change runs `parseParams(page)` which produces fresh query-param arrays even when content is unchanged (e.g., drawer open/close adds /candidate/[id] route segments while electionId search param is identical). Without this guard, every navigation cascaded selectedElections → nominationAndQuestionState → filterState, rebuilding FilterGroup instances and dropping any active filter rules — observed in the browser as "filter badge disappears after closing candidate drawer". Svelte 4 stores absorbed this via `writable.set()`'s no-op-write skip; Svelte 5 raw `$state` writes need an explicit equality check.
function sameRefs<TItem>(a: ReadonlyArray<TItem>, b: ReadonlyArray<TItem>): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
