import { log } from '@openvaa/app-shared';
import { DISTANCE_METRIC, MatchingAlgorithm, MISSING_VALUE_METHOD } from '@openvaa/matching';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext, untrack } from 'svelte';
import { page } from '$app/state';
import { getImpliedConstituencyIds, getImpliedElectionIds } from '$lib/routes';
import { resolveOrganizationMatching } from '$lib/utils/organizationMatching';
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
import { sameRefs } from '../utils/sameRefs';
import type { CustomData } from '@openvaa/app-shared';
import type { Id } from '@openvaa/core';
import type { AnyQuestionVariant, Constituency, Election, EntityType, QuestionCategory } from '@openvaa/data';
import type { AppContext } from '../app';
import type { QuestionBlocks } from '../utils/questionBlockState.type';
import type { VoterContext } from './voterContext.type';

const CONTEXT_KEY = Symbol();

/**
 * The voter context: an orchestrator that inherits the app context and adds the voter's selections, questions, answers, matches and filters. `initVoterContext()` constructs it at component init.
 *
 * Its own members are prototype getters, so consumers must not spread it. The inherited app context members are forwarded onto the instance by `inheritContextMembers`, which keeps their reactive accessors live.
 *
 * Field initializers run in declaration order, so each field is declared after the fields it reads. The `$effect` blocks run in the constructor, which is legal because the context is constructed during component init, an effect context.
 *
 * @internal Test seam; use `initVoterContext()`. Constructing it directly bypasses the `CONTEXT_KEY` double-init guard, throws `effect_orphan` outside a component `<script>` or `$effect.root`, and installs the `initFilterContext` side effects without the single-init protection.
 * @throws When constructed outside a Svelte effect context (effect_orphan).
 * @throws When `initFilterContext` has already been called (double-init guard).
 */
export class VoterContextProvider implements VoterContext {
  ////////////////////////////////////////////////////////////
  // Private $state backings + persisted/param handles
  ////////////////////////////////////////////////////////////

  // `$state` mirrors written by `$effect` blocks in the constructor. A lookup that throws during navigation clears the mirror inside the effect instead of throwing from a derivation.
  #selectedElections = $state<Array<Election>>([]);
  #selectedConstituencies = $state<Array<Constituency>>([]);

  // `$state` mirrors written by one `$effect` in the constructor from the shared question rollup.
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

  // Plain `$state`, not persisted: `bind:group` through a context accessor backed by a persisted store drops writes intermittently. An effect in the constructor selects every category once they load, so the counter never renders a transient 0.
  #selectedQuestionCategoryIds = $state<Array<Id>>([]);
  #hasSeededCategorySelection = $state(false);

  #firstQuestionId = sessionStorageState('voterContext-firstQuestionId', null as Id | null);

  // Param-based collection stores (class instances; read via `.value`).
  #electionId = paramState('electionId');
  #constituencyId = paramState('constituencyId');

  /**
   * The matching algorithm, exposed as the `algorithm` member.
   */
  algorithm = new MatchingAlgorithm({
    distanceMetric: DISTANCE_METRIC.Manhattan,
    missingValueOptions: {
      method: MISSING_VALUE_METHOD.RelativeMaximum
    }
  });

  ////////////////////////////////////////////////////////////
  // The app context and its stable references, declared before the producers and projections below that read them.
  ////////////////////////////////////////////////////////////

  #appContext = getAppContext();

  // The app context's reactive accessors, re-read on every access. They are private getters rather than fields because a field initializer would capture the value once at construction.
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
  // Sub-state producers. Their arguments are thunks, evaluated on first read, so they may reference fields declared later.
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
  // `$derived` projections, read through the prototype getters below. Their bodies are evaluated on first read, so they may reference fields declared later, such as `#matches`.
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
  // The election whose results page is rendered, from the route segment `page.params.electionTab`. It is distinct from `selectedElections`, the elections available to the voter, which come from the `electionId` search param.
  //
  // A `$derived.by` suffices here, unlike the `selectedElections` mirror: it only looks the tab up in the already-resolved `selectedElections`, so nothing can throw during navigation.
  //
  // Resolution:
  //   1. The route segment is present and found in `selectedElections`: that election.
  //   2. The route segment is absent and exactly one election is selected: that election, as in the results `+layout.svelte`.
  //   3. Otherwise `undefined`. When the segment is stale, `(voters)/(located)/results/[[electionTab]]/+layout.ts` normally redirects first; this covers late updates.
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

  /** The parent entity matching method. A missing, empty or unknown stored value resolves to the shipped default, never to `'none'`. */
  #parentMatchingMethod = $derived(resolveOrganizationMatching(this.#appSettings.matching?.organizationMatching));

  // The entity type shown for `currentResultsElection`: the type named by `page.params.entityTab` when the election has matches for it, otherwise the first type with matches. `undefined` when there is no election or its matches are not built yet.
  //
  // It lives here rather than in the route layout so the URL need not carry `entityTab`: filling it in would redirect `/results/{e}` to `/results/{e}/candidates`, which loops with consumers that emit URLs of the same shape. `filterContext` resolves its scope from this value for the same reason.
  //
  // Read it as `ctx.currentResultsEntityType`; never destructure it (CLAUDE.md, Context Destructuring Rule).
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
  // Inherited app context members, declared for `implements VoterContext` and installed by `inheritContextMembers` in the constructor, hence the definite-assignment `!`.
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
    // `inheritContextMembers` forwards the app context's reactive accessors (`appSettings`, `dataRoot`, `locale`) as live accessors, where `Object.assign` would copy their construction-time values.
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
        // Every URL change yields fresh param arrays, so keep the current array when it holds the same elections: a new one would wake every reader and rebuild the filter groups, dropping their active rules.
        if (!sameRefs(next, this.#selectedElections)) this.#selectedElections = next;
      } catch (e) {
        // The lookup throws transiently during navigation, when the new params arrive before the loader has provided their data. A `goto` from here would race the navigation, so clear the mirror and leave any redirect to the route's `+page.ts` / `+layout.ts`.
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
        // Transient during navigation, as for the elections: clear the mirror and leave any redirect to the route.
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
      // Pass `dr`, read inside this effect's tracking scope, by value: a `$derived` alias or a thunk goes stale on cold entry (see `../utils/questionRollup`).
      // The voter app hides questions marked `hidden`; the rollup applies the predicate to both info and opinion questions.
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

    // Select every opinion category once they are available. `#hasSeededCategorySelection` makes this run once, so a later change of elections or constituencies keeps the voter's own selection.
    $effect(() => {
      if (this.#hasSeededCategorySelection) return;
      const cats = this.#opinionQuestionCategories;
      if (cats.length === 0) return;
      untrack(() => {
        this.#selectedQuestionCategoryIds = cats.map((c) => c.id);
        this.#hasSeededCategorySelection = true;
      });
    });

    // Question blocks: the applicable questions of the selected categories. When `firstQuestionId` is set, its block moves first and the question moves to the front of that block.
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

    // The filter context reads the filter tree and the current entity type through these thunks, so it resolves its scope without `entityTab` in the URL. `initFilterContext` throws a 500 when called a second time.
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
    // Clearing the seed guard makes the seeding effect select every category again.
    this.#selectedQuestionCategoryIds = [];
    this.#hasSeededCategorySelection = false;
  };

  ////////////////////////////////////////////////////////////
  // Surface members (prototype accessors)
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
   * The filter context, read through `getFilterContext()` on every access, so this exposes the same instance without capturing it at construction.
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
 * Initialize and return the context. This must be called before `getVoterContext()` and cannot be called twice.
 * @returns The context object
 */
export function initVoterContext(): VoterContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initVoterContext() called for a second time');
  return setContext<VoterContext>(CONTEXT_KEY, new VoterContextProvider());
}
