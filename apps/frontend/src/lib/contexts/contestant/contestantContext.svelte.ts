import { log } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { askedAgainTooSoon, settledOrBounded, wordingOf } from '$lib/contestant/entryFlow';
import { nominationsEditableOf } from '$lib/contestant/nominations';
import { hasNomination, requiredInfoQuestionsOf, taskStateOf, unansweredQuestionsOf } from '$lib/contestant/tasks';
import { entityDescriptorOf } from '$lib/contestant/utils/entityDescriptor';
import { isNameEditable, isRequiredNameMissing } from '$lib/contestant/utils/nameRule';
import { contestantHomeRoute, getImpliedElectionIds } from '$lib/routes';
import { removeDuplicates } from '$lib/utils/removeDuplicates';
import { contestantUserDataState } from './contestantUserDataState.svelte';
import { getAppContext } from '../app';
import { getAuthContext } from '../auth';
import { inheritContextMembers } from '../utils/inheritContextMembers';
import { localStorageState, sessionStorageState } from '../utils/persistedState.svelte';
import { prepareDataWriter } from '../utils/prepareDataWriter';
import { rollUpQuestionCategories } from '../utils/questionRollup';
import type { Id } from '@openvaa/core';
import type { AnyQuestionVariant, Constituency, Election, QuestionCategory } from '@openvaa/data';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type {
  DataWriter,
  DesiredNomination,
  EntityNomination,
  NominationContest,
  NominationParentOption,
  SetEntityNominationsResult,
  UserEntity
} from '$lib/api/base/dataWriter.type';
import type { EntryFlow, EntryHeldCode, EntryHeldRequest, EntryLinkRequest } from '$lib/contestant/entryFlow';
import type { NameFieldValues } from '$lib/contestant/utils/nameRule';
import type { AppContext } from '../app';
import type { AuthContext } from '../auth';
import type { ContestantContext } from './contestantContext.type';

const CONTEXT_KEY = Symbol();

/**
 * What `entities` answers with when the page data holds no list. One frozen array, so the accessor keeps its identity from one page without a list to the next.
 */
const NO_ENTITIES: ReadonlyArray<UserEntity> = Object.freeze([]);

type QuestionBlocksShape = {
  blocks: Array<Array<AnyQuestionVariant>>;
  readonly questions: Array<AnyQuestionVariant>;
  getByCategory: (qc: { id: Id }) => { block: Array<AnyQuestionVariant>; index: number } | undefined;
  getByQuestion: (q: {
    id: Id;
  }) => { block: Array<AnyQuestionVariant>; index: number; indexInBlock: number; indexOfBlock: number } | undefined;
};

/**
 * The blocks of an entity that is asked no opinion question, and of no entity.
 * @returns A new, empty set of blocks.
 */
function noQuestionBlocks(): QuestionBlocksShape {
  return {
    blocks: [],
    get questions() {
      return [];
    },
    getByCategory: () => undefined,
    getByQuestion: () => undefined
  };
}

/**
 * The candidate context (orchestrator) as a Svelte 5 CLASS (`ContestantContextProvider`).
 * Constructed via `new ContestantContextProvider()` inside `initContestantContext()`, at component-init time.
 *
 * ── Shape decision ──────────────────────────────────────────────────────────
 * NO consumer spreads `contestantContext` (`{ ...contestantContext }` / `...getContestantContext()` / `...userData` → zero hits). So its OWN members are exposed as plain PROTOTYPE GETTERS (the natural class shape) — contestantContext does NOT need the own-enumerable discipline. The own-enumerable concern applies ONLY to the INHERITED appContext + authContext members, which arrive already own-enumerable from the AppContextProvider + AuthContextProvider instances and are forwarded onto this instance rather than spread into it.
 *
 * ── logout override (LANDMINE) ───────────────────────────────────────────────
 * `logout` is declared on ContestantContext (the surface) and wraps the inherited authContext logout with a post-logout `goto(...).then(#reset)`. Because field initializers run BEFORE the constructor body, an arrow-FIELD `logout` would be CLOBBERED by `Object.assign(this, this.#authContext)`. So `logout` is exposed as a PROTOTYPE GETTER delegating to a private `#logout` arrow — prototype members are NOT own-enumerable, so `Object.assign` does NOT overwrite them.
 *
 * ── isAuthenticated ──────────────────────────────────────────────────────────
 * `isAuthenticated` is a PROTOTYPE GETTER that re-reads the auth context's live accessor on every access, and it is left out of the `Object.assign` of the auth members. A copied value would be the one read at construction, so a sign-in or a sign-out that keeps this context mounted would never reach a consumer.
 *
 * ── Destructure-trap contract ────────────────────────────────────────────────
 * This context is the canonical example of the destructure trap (CLAUDE.md Context Destructuring Rule; the push-based `$state` mirrors below are what keeps it from firing). Class prototype getters preserve the contract: reads via `ctx.X` re-invoke the getter in the tracking scope, so updates after data load propagate. Do NOT regress to destructured-capture or a pull-chain.
 *
 * ── User-level data beside the entity store ──────────────────────────────────
 * `user`, `entities`, `selectedEntity`, `homeRoute` and `nominations` are reactive accessors derived from `page.data` and `page.params`: who is signed in, what they may edit, which of those the route names, where "home" leads from the current page, and the nominations the entity-level load read for the entity on the page. `userData` holds the one entity being edited and stays a stable reference. The five follow the same contract: read `ctx.X`, never destructure.
 *
 * ── The task state ───────────────────────────────────────────────────────────
 * `taskState` is one `$derived.by` that reads its inputs in its own scope and hands their values to the pure `taskStateOf`. Whether the entity has a nomination comes from the page data, so it is right on the server and on the first frame; the counts come from the store and the question lists, and count only while the store holds the entity the route names. `tasks`, `nextStep` and `previewOpen` are that state's own members, and `profileComplete` is its `allComplete`.
 *
 * ── The entry flow ───────────────────────────────────────────────────────────
 * `entryFlow` is what the screens that lead to a mailed link keep between them: a registration code with the status its check answered, and the one link request the "email sent" screen can repeat. It is the private `$state` field `#entryFlow` of this instance and nothing else. The server builds one context for each render, so a field of the instance is one visitor's alone, where a binding of the module would be every visitor's. It is written whole by `holdEntryCode`, `sendEntryLink` (which `resendEntryLink` calls) and `clearEntryFlow`, cleared by `#reset` on logout, and gone when the tab reloads. `sendEntryLink` is the one way a screen asks for a link: it resolves alike for a request that succeeded, failed or never answered, and holds nothing of an answer, so no screen can show what the server did with an address. `entryFlow` is a reactive accessor replaced whole on every write: read `ctx.entryFlow`, never destructure. The four functions and the three writer forwards beside them are stable.
 *
 * ── Field-init order ─────────────────────────────────────────────────────────
 * The stable refs / persisted handles / `$state` / `$derived` fields + the `#userData` composite are field initializers (run in declaration order BEFORE the constructor body). `#userData` is declared AFTER `#answersLocked` + `#locale` because its getter-thunks read them, and `#loadedEntityType` AFTER `#userData` because it reads the store. `#taskState` is declared below the unanswered lists and the name flag it reads. The 3 `$effect` blocks + the two member forwards are installed in the CONSTRUCTOR — legal because contestantContext is constructed during component init, an effect context.
 *
 * @internal — test seam — do not construct directly; requires effect context; use `initContestantContext()`. Calling `new ContestantContextProvider()` outside `initContestantContext()` bypasses the `CONTEXT_KEY` double-init guard and will throw `effect_orphan` outside a component `<script>` or `$effect.root`.
 * @throws When constructed outside a Svelte effect context (effect_orphan).
 */
export class ContestantContextProvider implements ContestantContext {
  ////////////////////////////////////////////////////////////
  // Inheritance from other Contexts + STABLE refs (field initializers — they run BEFORE the $derived/producer field initializers below in declaration order, so those can read them; the appContext + authContext members are reproduced via `Object.assign(this, this.#appContext)` + `Object.assign(this, this.#authContext)` in the constructor).
  ////////////////////////////////////////////////////////////

  #appContext = getAppContext();
  #authContext = getAuthContext();

  // getRoute is a rune-native `{ readonly current }` handle; read directly via `#getRoute.current(...)`. appSettings/locale/dataRoot are BARE reactive accessors — read `this.#appContext.X` directly.
  // They are exposed here as private GETTERS (not value-captured fields): a field initializer would snapshot the bare value once at construction and lose reactivity; the getters re-invoke `this.#appContext.X` inside the tracking scope on every read.
  #getRoute = this.#appContext.getRoute;
  get #appSettings(): AppContext['appSettings'] {
    return this.#appContext.appSettings;
  }
  get #locale(): AppContext['locale'] {
    return this.#appContext.locale;
  }
  get #dataRoot(): AppContext['dataRoot'] {
    return this.#appContext.dataRoot;
  }
  // The private handle the logout override delegates to (replaces the former `const { logout: _logout } = authContext`).
  #authLogout = this.#authContext.logout;

  ////////////////////////////////////////////////////////////////////
  // User data, authentication and the two locks
  ////////////////////////////////////////////////////////////////////

  #answersLocked = $derived(!!this.#appSettings.access.answersLocked);

  #nominationsLocked = $derived(!!this.#appSettings.access.nominationsLocked);

  #idTokenClaims = $derived(page.data.claims ?? undefined);

  // The user-level data, beside the store that holds the entity being edited. All four derive from `page`, so they need no push from a layout, are right on the server and on first paint, and are empty on pages outside the protected tree, whose page data holds neither key.
  #user = $derived(page.data.user ?? undefined);

  #entities = $derived<ReadonlyArray<UserEntity>>(page.data.entities ?? NO_ENTITIES);

  // The nominations the entity-level load read for the entity on the page. `undefined` on a page whose data holds no entity.
  #nominations = $derived<ReadonlyArray<EntityNomination> | undefined>(page.data.contestantUserData?.nominations);

  // Type and id are matched together: the entity tables have independent primary keys, so one id can name an entity of each type.
  #selectedEntity = $derived.by(() => {
    // Both are `undefined` on a route that carries neither.
    const { entityType, entityId } = page.params;
    if (!entityType || !entityId) return undefined;
    return this.#entities.find((entity) => entity.type === entityType && entity.id === entityId);
  });

  // Follows the route params alone, not `selectedEntity`: a URL that names an entity keeps its own home link whether or not the list holds that entity.
  #homeRoute = $derived(this.#getRoute.current(contestantHomeRoute(page.params)));

  // userData composite producer — declared AFTER #answersLocked + #locale because the getter-thunks read them. The thunks are lazy, so this is safe.
  #userData = contestantUserDataState({
    answersLocked: () => this.#answersLocked,
    dataWriter: prepareDataWriter,
    locale: () => this.#locale
  });

  // The type of the entity the store holds, which is the scope of the questions that entity is asked. `undefined` while the store holds none.
  #loadedEntityType = $derived(this.#userData.savedEntityData?.type);

  // What the entry flow holds between its screens: a checked registration code, the one link request that can be repeated, both, or nothing. A field of the instance, because the server builds one context for each render and a binding of the module would be shared by every visitor it renders for. Replaced whole on every write, and written to no storage, cookie, URL or history state.
  #entryFlow = $state.raw<EntryFlow | undefined>(undefined);

  ////////////////////////////////////////////////////////////////////
  // Properties matching those in the VoterContext
  ////////////////////////////////////////////////////////////////////

  #electionsSelectable = $derived(this.#dataRoot.elections?.length !== 1);

  #constituenciesSelectable = $derived(this.#dataRoot.elections?.some((e) => !e.singleConstituency));

  // Persisted handles — imperative round-trip via `.current`/`.set`; NO $effect-driven init.
  #preregistrationElectionIds = sessionStorageState('contestantContext-preselectedElectionIds', new Array<Id>());

  #preregistrationConstituencyIds = sessionStorageState<{
    [electionId: Id]: Id;
  }>('contestantContext-preselectedConstituencyIds', {});

  #isPreregistered = localStorageState('contestantContext-isPreregistered', false);

  #preregistrationElections = $derived.by(() => {
    const settings = this.#appSettings;
    const dr = this.#dataRoot;
    const preregIds = this.#preregistrationElectionIds.current;
    const ids = getImpliedElectionIds({ appSettings: settings, dataRoot: dr }) ?? preregIds;
    return ids.map((id) => dr.getElection(id));
  });

  #preregistrationNominations = $derived.by(() => {
    const constIds = this.#preregistrationConstituencyIds.current;
    return this.#preregistrationElections
      .map((e) => ({
        constituencyId: constIds[e.id] || e.singleConstituency?.id,
        electionId: e.id
      }))
      .filter(({ constituencyId }) => !!constituencyId) as Array<{
      electionId: Id;
      constituencyId: Id;
    }>;
  });

  // A pull-chain `$derived.by` pattern (via helper stores) does NOT propagate reactive invalidation correctly to cross-module consumers — measured by console trace: the selectedElections/opinionQuestions derivations evaluated ONCE at component-init with pre-data values and never re-ran after the protected layout `$effect` populated dataRoot + userData.
  // Root mechanism: Svelte 5 tracks reactive reads from within a tracking scope, but a DESTRUCTURED context-object property (`const { opinionQuestions } = ctx`) captures the getter's INITIAL return value as a plain local binding — the consumer's `$effect` reading `opinionQuestions.length` thereafter has no live reactive source. The `$derived` chain did recompute internally, but downstream reads via the destructured property saw only the pre-data snapshot.
  //
  // So selectedElections/selectedConstituencies + the downstream question chain are push-based `$state` mirrors updated by a single `$effect`. `$state` reads through context getters propagate correctly. Consumers MUST read `ctx.X` directly rather than destructure; inline derivations take the place of a helper-store pull chain (the helpers remain for voterContext).
  #selectedElections = $state<Array<Election>>([]);
  #selectedConstituencies = $state<Array<Constituency>>([]);

  /**
   * All applicable, non-empty question categories to be used as a base for the other stores.
   * Written by a single push-based `$effect` rather than a pull-chain of helper-store derivations. Behaviour is equivalent to `questionCategoryState`/`questionState`/`questionBlockState`, but the consumer-facing reactivity works via context getters.
   */
  #infoQuestionCategories = $state<Array<QuestionCategory>>([]);
  #opinionQuestionCategories = $state<Array<QuestionCategory>>([]);
  #infoQuestions = $state<Array<AnyQuestionVariant>>([]);
  #opinionQuestions = $state<Array<AnyQuestionVariant>>([]);
  #questionBlocks = $state<QuestionBlocksShape>(noQuestionBlocks());

  // Written by the effect that writes the question lists, in the same run, so the two never disagree in what a consumer reads.
  #questionsReady = $state(false);

  ////////////////////////////////////////////////////////////////////
  // Other properties specific to ContestantContext
  ////////////////////////////////////////////////////////////////////

  #requiredInfoQuestions = $derived(requiredInfoQuestionsOf(this.#infoQuestions));

  // With no entity in the store there is no answers object, and every question counts as unanswered.
  #unansweredRequiredInfoQuestions = $derived(
    unansweredQuestionsOf(this.#requiredInfoQuestions, this.#userData.savedEntityData?.answers)
  );

  #unansweredOpinionQuestions = $derived(
    unansweredQuestionsOf(this.#opinionQuestions, this.#userData.savedEntityData?.answers)
  );

  // A required name field counts only while the user can still fill it: a locked name with nothing in it is not theirs to complete.
  #requiredNameMissing = $derived.by(() => {
    if (!isNameEditable(this.#selectedEntity, this.#answersLocked)) return false;
    const entityType = this.#loadedEntityType;
    const saved = this.#userData.savedEntityData;
    if (!entityType || !saved) return false;
    const savedNames: NameFieldValues = { text: saved, byLocale: this.#userData.savedLocalizedNames ?? {} };
    return entityDescriptorOf(entityType).identityFields.some((field) => isRequiredNameMissing(field, savedNames));
  });

  // Every input is read here, in this derived's own scope, and handed over as a value.
  #taskState = $derived.by(() => {
    const selected = this.#selectedEntity;
    const nominations = this.#nominations;
    // The page data's entity is compared with the one the route names, so one entity's nominations are never taken for another's.
    const listedOnPage = page.data.contestantUserData?.entity;
    const entityKnown =
      !!selected && !!nominations && listedOnPage?.type === selected.type && listedOnPage?.id === selected.id;
    // The counts below are those of the entity in the store, which is the route's entity only once the store was given its data.
    const saved = this.#userData.savedEntityData;
    const storeHoldsSelected = !!selected && !!saved && saved.type === selected.type && saved.id === selected.id;
    const unansweredOpinionQuestions = this.#unansweredOpinionQuestions;
    return taskStateOf({
      entityKnown,
      hasNomination: hasNomination(nominations),
      nominationsEditable: nominationsEditableOf({
        nominationsLocked: this.#nominationsLocked,
        answersLocked: this.#answersLocked
      }),
      questionsReady: this.#questionsReady && storeHoldsSelected,
      unansweredRequiredInfoCount: this.#unansweredRequiredInfoQuestions.length,
      requiredNameMissing: this.#requiredNameMissing,
      opinionCount: this.#opinionQuestions.length,
      unansweredOpinionCount: unansweredOpinionQuestions.length,
      firstUnansweredOpinionId: unansweredOpinionQuestions[0]?.id
    });
  });

  #profileComplete = $derived(this.#taskState.allComplete);

  ////////////////////////////////////////////////////////////
  // Inherited appContext members (declared for `implements ContestantContext`; INSTALLED via `Object.assign(this, this.#appContext)` in the constructor from the own-enumerable AppContextProvider instance). Definite-assignment `!`.
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
  readonly startPageview!: AppContext['startPageview'];
  readonly startEvent!: AppContext['startEvent'];
  readonly track!: AppContext['track'];
  readonly submitAllEvents!: AppContext['submitAllEvents'];
  readonly resetAllEvents!: AppContext['resetAllEvents'];
  readonly setPageVisible!: AppContext['setPageVisible'];
  readonly analyticsGate!: AppContext['analyticsGate'];
  readonly sendFeedback!: AppContext['sendFeedback'];
  readonly setDataConsent!: AppContext['setDataConsent'];
  readonly setFeedbackStatus!: AppContext['setFeedbackStatus'];
  readonly setSurveyStatus!: AppContext['setSurveyStatus'];
  readonly startFeedbackPopupCountdown!: AppContext['startFeedbackPopupCountdown'];
  readonly startSurveyPopupCountdown!: AppContext['startSurveyPopupCountdown'];
  readonly popupQueue!: AppContext['popupQueue'];

  ////////////////////////////////////////////////////////////
  // Inherited authContext members (declared for `implements ContestantContext`; INSTALLED via `Object.assign(this, this.#authContext)` in the constructor from the own-enumerable AuthContextProvider instance). `logout` and `isAuthenticated` are NOT declared here — contestantContext exposes each through a prototype getter (below).
  ////////////////////////////////////////////////////////////

  readonly setPassword!: AuthContext['setPassword'];

  constructor() {
    ////////////////////////////////////////////////////////////
    // Inheritance from other Contexts
    ////////////////////////////////////////////////////////////
    //
    // Forward appContext + authContext INSTEAD of spreading them: both sources are own-enumerable class instances (AppContextProvider + AuthContextProvider), so every member can be copied onto this instance. (The stable refs, persisted handles, $state, $derived, and #userData are field initializers above, which run in declaration order BEFORE this constructor body.)
    //
    // LANDMINE: `logout` is overridden by a getter-ONLY prototype accessor (no setter — see the `get logout()` block below). Under SSR the server renderer executes in strict-mode ESM, where `Object.assign` ATTEMPTING to write the authContext's own-enumerable `logout` arrow onto a getter-only accessor throws `TypeError: Cannot set property logout ... which has only a getter`. "A prototype getter is not clobbered" is only half the story: the getter survives, but the WRITE itself throws. So we copy every authContext member EXCEPT `logout`; the inherited logout is already captured in `#authLogout` and wrapped by the prototype getter.

    // Use inheritContextMembers (NOT Object.assign) so the bare reactive accessors (appSettings / dataRoot / locale) as LIVE accessors; Object.assign would snapshot and freeze their reactivity for consumers.
    inheritContextMembers(this, this.#appContext);
    // `isAuthenticated` is left out as well: copying it would freeze the value read at construction, so a sign-in or a sign-out that keeps this context mounted would never reach a consumer. It is forwarded live by the prototype getter below, and assigning to that getter-only accessor here would throw as `logout` does.
    const {
      logout: _inheritedLogout,
      isAuthenticated: _inheritedIsAuthenticated,
      ...authContextRest
    } = this.#authContext;
    Object.assign(this, authContextRest);

    ////////////////////////////////////////////////////////////////////
    // Elections and Constituencies push-based $state mirrors
    ////////////////////////////////////////////////////////////////////

    $effect(() => {
      const dr = this.#dataRoot;
      const current = this.#userData.current;
      if (!current || !dr.elections?.length) {
        this.#selectedElections = [];
        return;
      }
      try {
        this.#selectedElections = removeDuplicates(current.nominations.map((n) => dr.getElection(n.electionId)));
      } catch (e) {
        log.error(`[contestantContext selectedElections] Error fetching election: ${e}`);
        this.#selectedElections = [];
      }
    });

    $effect(() => {
      const dr = this.#dataRoot;
      const current = this.#userData.current;
      if (!current || !dr.constituencies?.length) {
        this.#selectedConstituencies = [];
        return;
      }
      try {
        this.#selectedConstituencies = removeDuplicates(
          current.nominations.map((n) => dr.getConstituency(n.constituencyId))
        );
      } catch (e) {
        log.error(`[contestantContext selectedConstituencies] Error fetching constituency: ${e}`);
        this.#selectedConstituencies = [];
      }
    });

    $effect(() => {
      const dr = this.#dataRoot;
      const elections = this.#selectedElections;
      const constituencies = this.#selectedConstituencies;
      const entityType = this.#loadedEntityType;
      // The lists and the fact that they were rolled up are written together in every run, on every path.
      if (!entityType) {
        this.#writeNoQuestions();
        return;
      }
      // An entity with no selected election is asked no question, whatever the data root holds: a category with no election filter would otherwise apply to it.
      if (elections.length === 0) {
        this.#writeNoQuestions();
        return;
      }
      // `dr` was read above, inside this effect's tracking scope, and is handed to the shared rollup BY VALUE — never as a `$derived` alias and never as a thunk. See `../utils/questionRollup` for why either shape goes stale on cold entry.
      const {
        infoCategories: nextInfoCats,
        opinionCategories: nextOpinionCats,
        infoQuestions: nextInfoQuestions,
        opinionQuestions: nextOpinionQuestions
      } = rollUpQuestionCategories({ dataRoot: dr, elections, constituencies, entityType });
      // Blocks stay here: the contestant app builds them from every opinion category, the voter app from a filtered and reordered subset, so sharing them would be a parameterised branch rather than shared logic.
      const nextBlocks = nextOpinionCats
        .map((c) => c.getApplicableQuestions({ elections, constituencies, entityType }))
        .filter((b) => b.length > 0);

      this.#infoQuestionCategories = nextInfoCats;
      this.#opinionQuestionCategories = nextOpinionCats;
      this.#infoQuestions = nextInfoQuestions;
      this.#opinionQuestions = nextOpinionQuestions;
      this.#questionBlocks = {
        blocks: nextBlocks,
        get questions() {
          return nextBlocks.flat();
        },
        getByCategory: ({ id }: { id: Id }) => {
          const block = nextBlocks.find((b) => b[0]?.category.id === id);
          if (!block) return undefined;
          return { block, index: nextBlocks.indexOf(block) };
        },
        getByQuestion: ({ id }: { id: Id }) => {
          const indexOfBlock = nextBlocks.findIndex((b) => b.find((q) => q.id === id));
          if (indexOfBlock === -1) return undefined;
          const block = nextBlocks[indexOfBlock];
          const index = nextBlocks.flat().findIndex((q) => q.id === id);
          const indexInBlock = block.findIndex((q) => q.id === id);
          if (index === -1 || indexInBlock === -1) return undefined;
          return { block, index, indexInBlock, indexOfBlock };
        }
      };
      this.#questionsReady = true;
    });
  }

  /**
   * Write empty question lists and blocks, and that no rollup stands behind them.
   */
  #writeNoQuestions(): void {
    this.#infoQuestionCategories = [];
    this.#opinionQuestionCategories = [];
    this.#infoQuestions = [];
    this.#opinionQuestions = [];
    this.#questionBlocks = noQuestionBlocks();
    this.#questionsReady = false;
  }

  ////////////////////////////////////////////////////////////////////
  // Wrappers for DataWriter methods (arrow fields — survive detach) NB. These automatically handle authentication See also userData which handles other methods
  ////////////////////////////////////////////////////////////////////

  // These are exported for convenience so that all relevant methods can be accessed via the context on the client-side.
  // NB. We have to repeat a lot of code bc of typing constraints
  checkInvitationCode = (
    ...args: Parameters<DataWriter['checkInvitationCode']>
  ): ReturnType<DataWriter['checkInvitationCode']> => {
    return prepareDataWriter().checkInvitationCode(...args);
  };

  requestSignInLink = (
    ...args: Parameters<DataWriter['requestSignInLink']>
  ): ReturnType<DataWriter['requestSignInLink']> => {
    return prepareDataWriter().requestSignInLink(...args);
  };

  requestPasswordRecovery = (
    ...args: Parameters<DataWriter['requestPasswordRecovery']>
  ): ReturnType<DataWriter['requestPasswordRecovery']> => {
    return prepareDataWriter().requestPasswordRecovery(...args);
  };

  ////////////////////////////////////////////////////////////////////
  // The entry flow (arrow fields — survive detach). Each writes `#entryFlow` whole; see the class JSDoc.
  ////////////////////////////////////////////////////////////////////

  // Holds the checked code for the screen that uses it next. A request held before belongs to an earlier pass through the flow and goes.
  holdEntryCode = (code: EntryHeldCode): void => {
    this.#entryFlow = { code };
  };

  // The one way a screen asks for a mailed link. The present time and the held request are read before the request is made, the request is awaited through the bounded wait, and only then is the state written, with the time of that moment. Nothing is caught here and nothing of the request is logged: the bounded wait is what never rejects, and it passes nothing of the answer on.
  sendEntryLink = async (request: EntryLinkRequest): Promise<void> => {
    const askedAgain = askedAgainTooSoon(this.#entryFlow?.request, request, Date.now());
    await settledOrBounded(this.#requestLink(request));
    const held: EntryHeldRequest = {
      origin: request.origin,
      wording: wordingOf(request),
      settledAt: Date.now(),
      askedAgain
    };
    if (request.email !== undefined) held.email = request.email;
    if (request.code !== undefined) held.code = request.code;
    // A request made with the held code keeps that code beside it. Any other request replaces the whole flow.
    const heldCode = this.#entryFlow?.code;
    this.#entryFlow =
      heldCode && heldCode.code === request.code ? { code: heldCode, request: held } : { request: held };
  };

  // Repeats exactly the held request, through the call its origin decides, and holds it again with a new settlement time.
  resendEntryLink = async (): Promise<void> => {
    const held = this.#entryFlow?.request;
    if (!held) return;
    const request: EntryLinkRequest = { origin: held.origin };
    if (held.email !== undefined) request.email = held.email;
    if (held.code !== undefined) request.code = held.code;
    await this.sendEntryLink(request);
  };

  clearEntryFlow = (): void => {
    this.#entryFlow = undefined;
  };

  /**
   * Make the writer call a link request's origin decides, in the locale the context has at the call: a password-recovery link for the forgot-password page, a sign-in link for every other origin. A request with neither an address nor a code has nothing to ask with and calls nothing.
   *
   * It is `async` so that a writer that throws at the call answers with a rejected promise, which the bounded wait takes as it takes any other outcome.
   */
  #requestLink = async (request: EntryLinkRequest): Promise<unknown> => {
    const locale = this.#locale;
    const { origin, email, code } = request;
    const writer = prepareDataWriter();
    if (origin === 'forgotPassword') {
      return email === undefined ? undefined : writer.requestPasswordRecovery({ email, locale });
    }
    if (email !== undefined) {
      return writer.requestSignInLink(code === undefined ? { email, locale } : { email, code, locale });
    }
    return code === undefined ? undefined : writer.requestSignInLink({ code, locale });
  };

  exchangeCodeForIdToken = async (opts: {
    authorizationCode: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<void> => {
    const dw = prepareDataWriter();
    try {
      const result = await dw.exchangeCodeForIdToken(opts);
      if (result.type === 'success') {
        return await goto(this.#getRoute.current('ContestantAppPreregister'), { invalidateAll: true });
      }
    } catch (e) {
      log.error(`Error exchanging authorization code for ID token: ${e ?? '-'}`);
    }
    return await goto(
      this.#getRoute.current({
        route: 'ContestantAppPreregisterStatus',
        code: 'strongIdentificationError'
      }),
      { invalidateAll: true }
    );
  };

  preregister = async (opts: {
    email: string;
    nominations: Array<{ electionId: Id; constituencyId: Id }>;
    extra: {
      emailTemplate: {
        subject: string;
        text: string;
        html: string;
      };
    };
  }): Promise<void> => {
    const dw = prepareDataWriter();
    try {
      const result = await dw.preregisterWithIdToken(opts);
      const errorMap: Record<number, string> = { 401: 'tokenExpiredError', 409: 'candidateExistsError' };
      let code: string;
      if (result.type === 'success') {
        this.#isPreregistered.set(true);
        code = 'success';
      } else {
        code = errorMap[result.response.status] ?? 'unknownError';
      }
      return await goto(
        this.#getRoute.current({
          route: 'ContestantAppPreregisterStatus',
          code
        }),
        { invalidateAll: true }
      );
    } catch (e) {
      log.error(`Error preregistering a candidate: ${e ?? '-'}`);
    }
    return await goto(this.#getRoute.current({ route: 'ContestantAppPreregisterStatus', code: 'unknownError' }), {
      invalidateAll: true
    });
  };

  clearIdToken = async (): Promise<void> => {
    const dw = prepareDataWriter();
    await dw.clearIdToken().catch((e) => {
      log.error(`Error logging out: ${e?.message ?? '-'}`);
    });
  };

  // Rejects when the write fails and neither catches nor logs: the caller is what shows the failure to the user.
  acceptTermsOfUse = async (): Promise<DataApiActionResult> => {
    const dw = prepareDataWriter();
    return dw.acceptTermsOfUse();
  };

  // The two calls on the nominations of the entity the route names. Each reads the selected entity when it is called, and neither catches nor logs: the caller is what shows a failure to the user.
  setEntityNominations = async (nominations: ReadonlyArray<DesiredNomination>): Promise<SetEntityNominationsResult> => {
    const target = this.#selectedEntityTarget();
    return prepareDataWriter().setEntityNominations({ target, nominations });
  };

  getNominationParentOptions = async (
    contests: ReadonlyArray<NominationContest>
  ): Promise<Array<NominationParentOption> | undefined> => {
    const target = this.#selectedEntityTarget();
    return prepareDataWriter().getNominationParentOptions({ target, contests, locale: this.#locale });
  };

  /**
   * The entity the route names, as the target of a writer call.
   * @throws When the route names no entity the user is listed with.
   */
  #selectedEntityTarget = (): { type: UserEntity['type']; id: Id } => {
    const selected = this.#selectedEntity;
    if (!selected) throw new Error('The route names no entity the user is listed with');
    return { type: selected.type, id: selected.id };
  };

  ////////////////////////////////////////////////////////////////////
  // logout override (LANDMINE — see class JSDoc). `logout` wraps the inherited authContext logout with a post-logout goto + #reset. It is a PROTOTYPE GETTER delegating to a private `#logout` arrow: prototype members are NOT own-enumerable, so `Object.assign(this, this.#authContext)` does NOT overwrite it (whereas an arrow FIELD `logout` WOULD be clobbered, because field initializers run BEFORE the constructor body).
  ////////////////////////////////////////////////////////////////////

  get logout() {
    return this.#logout;
  }
  #logout = async (): Promise<void> => {
    await this.#authLogout();
    return goto(this.#getRoute.current('ContestantAppLogin'), { invalidateAll: true }).then(this.#reset);
  };

  /**
   * Utility for resetting all data. Note that `isAuthenticated` is not reset, because it's derived from `page.data.session`
   */
  #reset = (): void => {
    this.#userData.reset();
    this.#entryFlow = undefined;
  };

  ////////////////////////////////////////////////////////////
  // Surface members (prototype get/set accessors — spread-safe). Reads via `ctx.X` re-invoke the getter in the tracking scope (destructure-trap contract).
  ////////////////////////////////////////////////////////////

  get answersLocked() {
    return this.#answersLocked;
  }
  get nominationsLocked() {
    return this.#nominationsLocked;
  }
  // Re-reads the auth context's live accessor on every access, so the read stays reactive.
  get isAuthenticated() {
    return this.#authContext.isAuthenticated;
  }
  get constituenciesSelectable() {
    return this.#constituenciesSelectable;
  }
  get selectedConstituencies() {
    return this.#selectedConstituencies;
  }
  get selectedElections() {
    return this.#selectedElections;
  }
  get electionsSelectable() {
    return this.#electionsSelectable;
  }
  get infoQuestionCategories() {
    return this.#infoQuestionCategories;
  }
  get infoQuestions() {
    return this.#infoQuestions;
  }
  get isPreregistered() {
    return this.#isPreregistered.current;
  }
  set isPreregistered(v) {
    this.#isPreregistered.set(v);
  }
  // No setter: the flow is written through `holdEntryCode`, `sendEntryLink`, `resendEntryLink` and `clearEntryFlow` alone.
  get entryFlow() {
    return this.#entryFlow;
  }
  get opinionQuestionCategories() {
    return this.#opinionQuestionCategories;
  }
  get opinionQuestions() {
    return this.#opinionQuestions;
  }
  get nominations() {
    return this.#nominations;
  }
  get taskState() {
    return this.#taskState;
  }
  get tasks() {
    return this.#taskState.tasks;
  }
  get nextStep() {
    return this.#taskState.nextStep;
  }
  get previewOpen() {
    return this.#taskState.previewOpen;
  }
  get profileComplete() {
    return this.#profileComplete;
  }
  get questionBlocks() {
    return this.#questionBlocks;
  }
  get questionsReady() {
    return this.#questionsReady;
  }
  get requiredInfoQuestions() {
    return this.#requiredInfoQuestions;
  }
  get unansweredOpinionQuestions() {
    return this.#unansweredOpinionQuestions;
  }
  get unansweredRequiredInfoQuestions() {
    return this.#unansweredRequiredInfoQuestions;
  }
  get userData() {
    return this.#userData;
  }
  get preregistrationElectionIds() {
    return this.#preregistrationElectionIds.current;
  }
  set preregistrationElectionIds(v) {
    this.#preregistrationElectionIds.set(v);
  }
  get preregistrationConstituencyIds() {
    return this.#preregistrationConstituencyIds.current;
  }
  set preregistrationConstituencyIds(v) {
    this.#preregistrationConstituencyIds.set(v);
  }
  get idTokenClaims() {
    return this.#idTokenClaims;
  }
  get user() {
    return this.#user;
  }
  get entities() {
    return this.#entities;
  }
  get selectedEntity() {
    return this.#selectedEntity;
  }
  get homeRoute() {
    return this.#homeRoute;
  }
  get preregistrationElections() {
    return this.#preregistrationElections;
  }
  get preregistrationNominations() {
    return this.#preregistrationNominations;
  }
}

export function getContestantContext(): ContestantContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getContestantContext() called before initContestantContext()');
  return getContext<ContestantContext>(CONTEXT_KEY);
}

/**
 * Initialize and return the context. This must be called before `getGlobalContext()` and cannot be called twice.
 * @returns The context object
 */
export function initContestantContext(): ContestantContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initContestantContext() called for a second time');
  return setContext<ContestantContext>(CONTEXT_KEY, new ContestantContextProvider());
}
