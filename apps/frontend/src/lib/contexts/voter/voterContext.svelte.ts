import { DISTANCE_METRIC, MatchingAlgorithm, MISSING_VALUE_METHOD } from '@openvaa/matching';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext, untrack } from 'svelte';
import { fromStore } from 'svelte/store';
import { goto } from '$app/navigation';
import { logDebugError } from '$lib/utils/logger';
import { getImpliedConstituencyIds, getImpliedElectionIds } from '$lib/utils/route';
import { answerStore } from './answerStore.svelte';
import { countAnswers } from './countAnswers';
import { filterStore } from './filters/filterStore.svelte';
import { matchStore } from './matchStore.svelte';
import { nominationAndQuestionStore } from './nominationAndQuestionStore.svelte';
import { getAppContext } from '../../contexts/app';
import { paramStore } from '../utils/paramStore.svelte';
import { questionBlockStore } from '../utils/questionBlockStore.svelte';
import { extractInfoCategories, extractOpinionCategories, questionCategoryStore } from '../utils/questionCategoryStore.svelte';
import { questionStore } from '../utils/questionStore.svelte';
import { sessionStorageWritable } from '../utils/persistedState.svelte';
import type { Id } from '@openvaa/core';
import type { EntityType } from '@openvaa/data';
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

  const selectedElections = $derived.by(() => {
    const dr = reactiveDataRoot.current;
    const settings = appSettingsState.current;
    const electionId = _electionId.value;
    const constituencyId = _constituencyId.value;
    if (!dr.elections.length) return [];
    const ids = electionId?.length
      ? electionId
      : getImpliedElectionIds({
          appSettings: settings,
          dataRoot: dr,
          selectedConstituencyIds: constituencyId
        });
    if (!ids?.length) return [];
    try {
      return ids.map((id) => dr.getElection(id));
    } catch (e) {
      logDebugError(`[selectedElections] Error fetching election: ${e}`);
      goto(getRouteState.current({ route: 'Elections', electionId: undefined, constituencyId: undefined }));
      return [];
    }
  });

  const selectedConstituencies = $derived.by(() => {
    const dr = reactiveDataRoot.current;
    const constituencyId = _constituencyId.value;
    const electionId = _electionId.value;
    if (!dr.constituencies.length) return [];
    const ids = constituencyId?.length
      ? constituencyId
      : getImpliedConstituencyIds({
          dataRoot: dr,
          selectedElectionIds: electionId
        });
    if (!ids?.length) return [];
    try {
      return ids.map((id) => dr.getConstituency(id));
    } catch (e) {
      logDebugError(`[selectedConstituencies] Error fetching constituency: ${e}`);
      goto(getRouteState.current({ route: 'Constituencies', constituencyId: undefined }));
      return [];
    }
  });

  ////////////////////////////////////////////////////////////
  // Questions and QuestionCategories
  ////////////////////////////////////////////////////////////

  /**
   * All applicable, non-empty question categories to be used as a base for the other stores.
   */
  const _questionCategories = questionCategoryStore({
    dataRoot: () => reactiveDataRoot.current,
    selectedElections: () => selectedElections,
    selectedConstituencies: () => selectedConstituencies
  });

  const _infoQuestionCategories = extractInfoCategories(() => _questionCategories.value);

  const _opinionQuestionCategories = extractOpinionCategories(() => _questionCategories.value);

  const _infoQuestions = questionStore({
    categories: () => _infoQuestionCategories.value,
    selectedElections: () => selectedElections,
    selectedConstituencies: () => selectedConstituencies,
    appType: 'voter'
  });

  const _opinionQuestions = questionStore({
    categories: () => _opinionQuestionCategories.value,
    selectedElections: () => selectedElections,
    selectedConstituencies: () => selectedConstituencies,
    appType: 'voter'
  });

  // QUESTION-03 fix (Phase 61 D-09 + D-11): pure $state, no sessionStorage.
  // `bind:group` on a getter/setter context accessor backed by
  // `fromStore(sessionStorageWritable)` intermittently failed to propagate writes
  // (known Svelte 5 binding pitfall — see RESEARCH §Pitfall 1). Migrated to pure
  // $state; session-only per D-11; default-all-checked seeded here rather than
  // in the page's onMount so the counter never renders the transient 0 state.
  let _selectedQuestionCategoryIds = $state<Array<Id>>([]);
  let hasSeededCategorySelection = $state(false);

  // Seed default-all-checked once opinion categories are available.
  // Guarded with `hasSeededCategorySelection` so voter de-selects are preserved
  // when `_opinionQuestionCategories.value` later reacts to election/constituency
  // changes (would otherwise clobber the voter's deliberate selection).
  $effect(() => {
    if (hasSeededCategorySelection) return;
    const cats = _opinionQuestionCategories.value;
    if (cats.length === 0) return;
    // Use untrack() for the write side to match the Phase 60 canonical pattern
    // (see +layout.svelte:116-133). This is defense-in-depth: pure $state writes
    // don't strictly require untrack here, but it prevents `effect_update_depth_exceeded`
    // if a later edit introduces a read-then-write cycle inside this effect.
    untrack(() => {
      _selectedQuestionCategoryIds = cats.map((c) => c.id);
      hasSeededCategorySelection = true;
    });
  });

  const _firstQuestionId = sessionStorageWritable('voterContext-firstQuestionId', null as Id | null);
  const firstQuestionIdState = fromStore(_firstQuestionId);

  const _selectedQuestionBlocks = questionBlockStore({
    firstQuestionId: () => firstQuestionIdState.current,
    opinionQuestionCategories: () => _opinionQuestionCategories.value,
    selectedQuestionCategoryIds: () => _selectedQuestionCategoryIds,
    selectedElections: () => selectedElections,
    selectedConstituencies: () => selectedConstituencies
  });

  ////////////////////////////////////////////////////////////
  // Matching, Voter Answers and Filters
  ///////////////////////////////////////////////////////////

  const answers = answerStore({ startEvent });

  const resultsAvailable = $derived.by(() => {
    const settings = appSettingsState.current;
    const questions = _opinionQuestions.value;
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
    get firstQuestionId() {
      return firstQuestionIdState.current;
    },
    set firstQuestionId(v) {
      _firstQuestionId.set(v);
    },
    get infoQuestionCategories() {
      return _infoQuestionCategories.value;
    },
    get infoQuestions() {
      return _infoQuestions.value;
    },
    get matches() {
      return _matches.value;
    },
    get nominationsAvailable() {
      return nominationsAvailable;
    },
    get opinionQuestionCategories() {
      return _opinionQuestionCategories.value;
    },
    get opinionQuestions() {
      return _opinionQuestions.value;
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
      return _selectedQuestionBlocks.value;
    },
    get selectedQuestionCategoryIds() {
      return _selectedQuestionCategoryIds;
    },
    set selectedQuestionCategoryIds(v) {
      _selectedQuestionCategoryIds = v;
    }
  });
}
