import { QUESTION_CATEGORY_TYPE } from '@openvaa/data';
import { DISTANCE_METRIC, MatchingAlgorithm, MISSING_VALUE_METHOD } from '@openvaa/matching';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext, untrack } from 'svelte';
import { fromStore } from 'svelte/store';
import { logDebugError } from '$lib/utils/logger';
import { getImpliedConstituencyIds, getImpliedElectionIds } from '$lib/utils/route';
import { answerStore } from './answerStore.svelte';
import { countAnswers } from './countAnswers';
import { filterStore } from './filters/filterStore.svelte';
import { matchStore } from './matchStore.svelte';
import { nominationAndQuestionStore } from './nominationAndQuestionStore.svelte';
import { getAppContext } from '../../contexts/app';
import { getFilterContext, initFilterContext } from '../filter';
import { paramStore } from '../utils/paramStore.svelte';
import { sessionStorageWritable } from '../utils/persistedState.svelte';
import type { CustomData } from '@openvaa/app-shared';
import type { Id } from '@openvaa/core';
import type { AnyQuestionVariant, Constituency, Election, EntityType, QuestionCategory } from '@openvaa/data';
import type { QuestionBlocks } from '../utils/questionBlockStore.type';
import type { VoterContext } from './voterContext.type';

const CONTEXT_KEY = Symbol();

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

  ////////////////////////////////////////////////////////////
  // Inheritance from other Contexts
  ////////////////////////////////////////////////////////////

  const appContext = getAppContext();
  const { appSettings, getRoute, locale, reactiveDataRoot, startEvent, t } = appContext;

  // Bridge store values to rune-compatible access
  const appSettingsState = fromStore(appSettings);
  const getRouteState = fromStore(getRoute);
  const localeState = fromStore(locale);

  ////////////////////////////////////////////////////////////
  // Elections and Constituencies
  ////////////////////////////////////////////////////////////

  // Stores related to selection pages

  const electionsSelectable = $derived(
    !appSettingsState.current.elections?.disallowSelection && reactiveDataRoot.current.elections?.length !== 1
  );

  const constituenciesSelectable = $derived(
    reactiveDataRoot.current.elections?.some((e) => !e.singleConstituency)
  );

  // Param-based collection stores

  const _electionId = paramStore('electionId');

  const _constituencyId = paramStore('constituencyId');

  // QUESTION-04 follow-up (Phase 61-03 voter-side parallel fix):
  // Push-based `$state` + `$effect` mirror, mirroring the candidateContext fix
  // documented at .planning/phases/61-voter-app-question-flow/61-03-DIAGNOSIS.md.
  // The previous `$derived.by` pull-chain captured initial empty values when
  // consumers destructured the context property; subsequent reads via the
  // destructured local were not live reactive sources, so updates after data
  // load did not propagate. `$state` reads through context getters propagate
  // correctly. Side effects (goto on stale id) live naturally inside `$effect`,
  // not inside a derivation.
  let selectedElections = $state<Array<Election>>([]);
  let selectedConstituencies = $state<Array<Constituency>>([]);

  $effect(() => {
    const dr = reactiveDataRoot.current;
    const settings = appSettingsState.current;
    const electionId = _electionId.value;
    const constituencyId = _constituencyId.value;
    if (!dr.elections.length) {
      selectedElections = [];
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
      selectedElections = [];
      return;
    }
    try {
      selectedElections = ids.map((id) => dr.getElection(id));
    } catch (e) {
      // DataRoot lookup throws transiently during navigation: when the URL
      // changes the page params arrive on the new route before the loader
      // has finished re-providing the corresponding data. Falling back to a
      // `goto('Elections')` here races with the in-flight navigation and
      // boomerangs the user back to /elections — the silent-fail flake
      // documented at multi-election.spec.ts:173. Clear the local mirror
      // and let the route's `+page.ts` / `+layout.ts` `redirect()` decide
      // whether a redirect is actually needed.
      logDebugError(`[selectedElections] Error fetching election: ${e}`);
      selectedElections = [];
    }
  });

  $effect(() => {
    const dr = reactiveDataRoot.current;
    const constituencyId = _constituencyId.value;
    const electionId = _electionId.value;
    if (!dr.constituencies.length) {
      selectedConstituencies = [];
      return;
    }
    const ids = constituencyId?.length
      ? constituencyId
      : getImpliedConstituencyIds({
          dataRoot: dr,
          selectedElectionIds: electionId
        });
    if (!ids?.length) {
      selectedConstituencies = [];
      return;
    }
    try {
      selectedConstituencies = ids.map((id) => dr.getConstituency(id));
    } catch (e) {
      // See parallel selectedElections catch above — clear the local mirror
      // and let the route loader handle redirects so we don't race the
      // in-flight navigation.
      logDebugError(`[selectedConstituencies] Error fetching constituency: ${e}`);
      selectedConstituencies = [];
    }
  });

  ////////////////////////////////////////////////////////////
  // Questions and QuestionCategories
  ////////////////////////////////////////////////////////////

  // QUESTION-04 follow-up (Phase 61-03 voter-side parallel fix):
  // Inlined the previous helper-store pull-chain (`questionCategoryStore` /
  // `questionStore` / `questionBlockStore`) into a single push-based `$effect`
  // that writes `$state` mirrors. The helper-store derivations were declared
  // in another module's scope and did not propagate invalidation across the
  // function-accessor boundary on the voter side (same root-cause class as
  // the candidate-side fix in 61-03-DIAGNOSIS.md). The behavior is
  // equivalent; helpers remain available for any non-context consumers.
  let _questionCategories = $state<Array<QuestionCategory>>([]);
  let _infoQuestionCategories = $state<Array<QuestionCategory>>([]);
  let _opinionQuestionCategories = $state<Array<QuestionCategory>>([]);
  let _infoQuestions = $state<Array<AnyQuestionVariant>>([]);
  let _opinionQuestions = $state<Array<AnyQuestionVariant>>([]);
  let _selectedQuestionBlocks = $state<QuestionBlocks>({
    blocks: [],
    get questions() {
      return [];
    },
    getByCategory: () => undefined,
    getByQuestion: () => undefined
  });

  // QUESTION-03 fix (Phase 61 D-09 + D-11): pure $state, no sessionStorage.
  // `bind:group` on a getter/setter context accessor backed by
  // `fromStore(sessionStorageWritable)` intermittently failed to propagate writes
  // (known Svelte 5 binding pitfall — see RESEARCH §Pitfall 1). Migrated to pure
  // $state; session-only per D-11; default-all-checked seeded here rather than
  // in the page's onMount so the counter never renders the transient 0 state.
  let _selectedQuestionCategoryIds = $state<Array<Id>>([]);
  let hasSeededCategorySelection = $state(false);

  const _firstQuestionId = sessionStorageWritable('voterContext-firstQuestionId', null as Id | null);
  const firstQuestionIdState = fromStore(_firstQuestionId);

  // Single $effect computes the entire question chain whenever upstream
  // state (selectedElections / selectedConstituencies / dataRoot) changes.
  $effect(() => {
    const dr = reactiveDataRoot.current;
    const elections = selectedElections;
    const constituencies = selectedConstituencies;
    const nextQuestionCategories =
      dr.questionCategories?.filter(
        (c) =>
          c.appliesTo({ elections, constituencies }) &&
          c.getApplicableQuestions({ elections, constituencies }).length > 0
      ) ?? [];
    const nextInfoCats = nextQuestionCategories.filter((qc) => qc.type !== QUESTION_CATEGORY_TYPE.Opinion);
    const nextOpinionCats = nextQuestionCategories.filter((qc) => qc.type === QUESTION_CATEGORY_TYPE.Opinion);
    // Voter-app filters out hidden questions (per `questionStore` original
    // behavior with appType: 'voter'). The opinion-question matchability check
    // mirrors the helper's invariant.
    const nextInfoQuestions = nextInfoCats.flatMap((c) =>
      c
        .getApplicableQuestions({ elections, constituencies })
        .filter((q) => !(q.customData as CustomData['Question'])?.hidden)
    );
    const nextOpinionQuestions = nextOpinionCats.flatMap((c) => {
      const questions = c
        .getApplicableQuestions({ elections, constituencies })
        .filter((q) => !(q.customData as CustomData['Question'])?.hidden);
      if (c.type === QUESTION_CATEGORY_TYPE.Opinion && questions.some((q) => !q.isMatchable))
        error(500, `Some opinion questions in category ${c.id} is not matchable.`);
      return questions;
    });

    _questionCategories = nextQuestionCategories;
    _infoQuestionCategories = nextInfoCats;
    _opinionQuestionCategories = nextOpinionCats;
    _infoQuestions = nextInfoQuestions;
    _opinionQuestions = nextOpinionQuestions;
  });

  // Seed default-all-checked once opinion categories are available.
  // Guarded with `hasSeededCategorySelection` so voter de-selects are preserved
  // when `_opinionQuestionCategories` later reacts to election/constituency
  // changes (would otherwise clobber the voter's deliberate selection).
  $effect(() => {
    if (hasSeededCategorySelection) return;
    const cats = _opinionQuestionCategories;
    if (cats.length === 0) return;
    untrack(() => {
      _selectedQuestionCategoryIds = cats.map((c) => c.id);
      hasSeededCategorySelection = true;
    });
  });

  // QuestionBlocks: filtered by the user's selected category ids and ordered
  // optionally by `firstQuestionId`. Mirrors the original `questionBlockStore`
  // logic verbatim; written into a `$state` for consumer reactivity.
  $effect(() => {
    const firstId = firstQuestionIdState.current;
    const allOpinionCats = _opinionQuestionCategories;
    const categoryIds = _selectedQuestionCategoryIds;
    const elections = selectedElections;
    const constituencies = selectedConstituencies;

    const filteredCats = categoryIds.length
      ? allOpinionCats.filter((c) => categoryIds.includes(c.id))
      : allOpinionCats;
    let blocks = filteredCats
      .map((c) => c.getApplicableQuestions({ elections, constituencies }))
      .filter((b) => b.length > 0);

    if (firstId) {
      const indexOfBlock = blocks.findIndex((b) => b.find((q) => q.id === firstId));
      if (indexOfBlock === -1) {
        logDebugError(`Bypassing invalid first question id: ${firstId}.`);
      } else {
        const block = blocks[indexOfBlock];
        const indexInBlock = block.findIndex((q) => q.id === firstId);
        const newFirstBlock = [block.splice(indexInBlock, 1)[0], ...block];
        blocks.splice(indexOfBlock, 1);
        blocks = [newFirstBlock, ...blocks];
      }
    }

    const finalBlocks = blocks;
    _selectedQuestionBlocks = {
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
  // Matching, Voter Answers and Filters
  ///////////////////////////////////////////////////////////

  const answers = answerStore({ startEvent });

  const resultsAvailable = $derived.by(() => {
    const settings = appSettingsState.current;
    const questions = _opinionQuestions;
    const currentAnswers = answers.answers;
    // For results to be available, we need at least the specified number of answers for each election
    if (selectedElections.length === 0) return false;
    return selectedElections.every((e) => {
      const applicableQuestions = questions.filter((q) => q.appliesTo({ elections: e }));
      return countAnswers({ answers: currentAnswers, questions: applicableQuestions }) >= settings.matching.minimumAnswers;
    });
  });

  /** The types of entities we show in results */
  const entityTypes = $derived(appSettingsState.current.results?.sections ?? []);

  /** The entity types to hide if missing opinion answers */
  const hideIfMissingAnswers = $derived(appSettingsState.current.entities?.hideIfMissingAnswers || {});

  // Matching and filtering depend on the available nominations and questions, for which we use a utility store
  const _nominationsAndQuestions = nominationAndQuestionStore({
    constituencies: () => selectedConstituencies,
    dataRoot: () => reactiveDataRoot.current,
    elections: () => selectedElections,
    entityTypes: () => entityTypes,
    hideIfMissingAnswers: () => hideIfMissingAnswers
  });

  const nominationsAvailable = $derived.by(() => {
    const nq = _nominationsAndQuestions.value;
    return Object.fromEntries(
      Object.entries(nq).map(([id, contents]) => [
        id,
        Object.values(contents).some(({ nominations }) => nominations.length > 0)
      ])
    );
  });

  const algorithm = new MatchingAlgorithm({
    distanceMetric: DISTANCE_METRIC.Manhattan,
    missingValueOptions: {
      method: MISSING_VALUE_METHOD.RelativeMaximum
    }
  });

  const minAnswers = $derived(appSettingsState.current.matching.minimumAnswers);

  /** Get the entityTypes whose cardContents include `submatches` */
  const calcSubmatches = $derived.by(() =>
    Object.entries(appSettingsState.current.results.cardContents)
      .filter(([, value]) => value?.includes('submatches'))
      .map(([type]) => type as EntityType)
  );

  /** The parent entity matching method */
  const parentMatchingMethod = $derived(appSettingsState.current.matching?.organizationMatching || 'none');

  const _matches = matchStore({
    algorithm,
    answers,
    nominationsAndQuestions: () => _nominationsAndQuestions.value,
    minAnswers: () => minAnswers,
    calcSubmatches: () => calcSubmatches,
    parentMatchingMethod: () => parentMatchingMethod
  });

  const _entityFilters = filterStore({
    nominationsAndQuestions: () => _nominationsAndQuestions.value,
    locale: () => localeState.current,
    t: () => t
  });

  // Phase 62 D-05: initialize the dedicated filterContext using a closure over
  // the just-built FilterTree. filterContext reads page.params for its
  // (electionId, entityTypePlural) scope key and bridges FilterGroup.onChange
  // → $state version counter so $derived consumers (EntityListWithControls)
  // re-run on filter mutation. Single init per voter session — re-init is
  // guarded by initFilterContext() itself (status-500).
  initFilterContext({ entityFilters: () => _entityFilters.value });

  ////////////////////////////////////////////////////////////
  // Resetting voter data
  ///////////////////////////////////////////////////////////

  function resetVoterData(): void {
    answers.reset();
    _firstQuestionId.set(null);
    // QUESTION-03: pure $state assignment + reset the seed-guard so the next
    // render re-seeds default-all-checked via the $effect above.
    _selectedQuestionCategoryIds = [];
    hasSeededCategorySelection = false;
  }

  ////////////////////////////////////////////////////////////
  // Build context
  ////////////////////////////////////////////////////////////

  return setContext<VoterContext>(CONTEXT_KEY, {
    ...appContext,
    algorithm,
    answers,
    get constituenciesSelectable() {
      return constituenciesSelectable;
    },
    get electionsSelectable() {
      return electionsSelectable;
    },
    get entityFilters() {
      return _entityFilters.value;
    },
    /**
     * D-05 bundled accessor — delegates to `getFilterContext()` so the same
     * Symbol-keyed context instance is exposed both directly (future LLM chat)
     * and via the voter context (voter-flow UI). Getter delegation avoids
     * capturing a stale reference at construction time.
     */
    get filterContext() {
      return getFilterContext();
    },
    get firstQuestionId() {
      return firstQuestionIdState.current;
    },
    set firstQuestionId(v) {
      _firstQuestionId.set(v);
    },
    get infoQuestionCategories() {
      return _infoQuestionCategories;
    },
    get infoQuestions() {
      return _infoQuestions;
    },
    get matches() {
      return _matches.value;
    },
    get nominationsAvailable() {
      return nominationsAvailable;
    },
    get opinionQuestionCategories() {
      return _opinionQuestionCategories;
    },
    get opinionQuestions() {
      return _opinionQuestions;
    },
    resetVoterData,
    get resultsAvailable() {
      return resultsAvailable;
    },
    get selectedConstituencies() {
      return selectedConstituencies;
    },
    get selectedElections() {
      return selectedElections;
    },
    get selectedQuestionBlocks() {
      return _selectedQuestionBlocks;
    },
    get selectedQuestionCategoryIds() {
      return _selectedQuestionCategoryIds;
    },
    set selectedQuestionCategoryIds(v) {
      _selectedQuestionCategoryIds = v;
    }
  });
}
