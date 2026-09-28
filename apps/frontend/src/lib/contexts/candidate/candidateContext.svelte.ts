import { getCustomData, log } from '@openvaa/app-shared';
import { ENTITY_TYPE, isEmptyValue } from '@openvaa/data';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { getImpliedElectionIds } from '$lib/routes';
import { removeDuplicates } from '$lib/utils/removeDuplicates';
import { candidateUserDataState } from './candidateUserDataState.svelte';
import { getAppContext } from '../app';
import { getAuthContext } from '../auth';
import { inheritContextMembers } from '../utils/inheritContextMembers';
import { localStorageState, sessionStorageState } from '../utils/persistedState.svelte';
import { prepareDataWriter } from '../utils/prepareDataWriter';
import { rollUpQuestionCategories } from '../utils/questionRollup';
import type { Id } from '@openvaa/core';
import type { AnyQuestionVariant, Constituency, Election, QuestionCategory } from '@openvaa/data';
import type { DataWriter } from '$lib/api/base/dataWriter.type';
import type { AppContext } from '../app';
import type { AuthContext } from '../auth';
import type { CandidateContext } from './candidateContext.type';

const CONTEXT_KEY = Symbol();

type QuestionBlocksShape = {
  blocks: Array<Array<AnyQuestionVariant>>;
  readonly questions: Array<AnyQuestionVariant>;
  getByCategory: (qc: { id: Id }) => { block: Array<AnyQuestionVariant>; index: number } | undefined;
  getByQuestion: (q: {
    id: Id;
  }) => { block: Array<AnyQuestionVariant>; index: number; indexInBlock: number; indexOfBlock: number } | undefined;
};

/**
 * The candidate context (orchestrator) as a Svelte 5 CLASS (`CandidateContextProvider`).
 * Constructed via `new CandidateContextProvider()` inside `initCandidateContext()`, at component-init time.
 *
 * ── Shape decision ──────────────────────────────────────────────────────────
 * NO consumer spreads `candidateContext` (`{ ...candidateContext }` / `...getCandidateContext()` / `...userData` → zero hits). So its OWN members are exposed as plain PROTOTYPE GETTERS (the natural class shape) — candidateContext does NOT need the own-enumerable discipline. The own-enumerable concern applies ONLY to the INHERITED appContext + authContext members, which arrive already own-enumerable from the AppContextProvider + AuthContextProvider instances and are forwarded onto this instance rather than spread into it.
 *
 * ── logout override (LANDMINE) ───────────────────────────────────────────────
 * `logout` is declared on CandidateContext (the surface) and wraps the inherited authContext logout with a post-logout `goto(...).then(#reset)`. Because field initializers run BEFORE the constructor body, an arrow-FIELD `logout` would be CLOBBERED by `Object.assign(this, this.#authContext)`. So `logout` is exposed as a PROTOTYPE GETTER delegating to a private `#logout` arrow — prototype members are NOT own-enumerable, so `Object.assign` does NOT overwrite them.
 *
 * ── Destructure-trap contract ────────────────────────────────────────────────
 * This context is the canonical example of the destructure trap (CLAUDE.md Context Destructuring Rule; the push-based `$state` mirrors below are what keeps it from firing). Class prototype getters preserve the contract: reads via `ctx.X` re-invoke the getter in the tracking scope, so updates after data load propagate. Do NOT regress to destructured-capture or a pull-chain.
 *
 * ── Field-init order ─────────────────────────────────────────────────────────
 * The stable refs / persisted handles / `$state` / `$derived` fields + the `#userData` composite are field initializers (run in declaration order BEFORE the constructor body). `#userData` is declared AFTER `#answersLocked` + `#locale` because its getter-thunks read them. The 3 `$effect` blocks + the two member forwards are installed in the CONSTRUCTOR — legal because candidateContext is constructed during component init, an effect context.
 *
 * @internal — test seam — do not construct directly; requires effect context; use `initCandidateContext()`. Calling `new CandidateContextProvider()` outside `initCandidateContext()` bypasses the `CONTEXT_KEY` double-init guard and will throw `effect_orphan` outside a component `<script>` or `$effect.root`.
 * @throws When constructed outside a Svelte effect context (effect_orphan).
 */
export class CandidateContextProvider implements CandidateContext {
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
  // User data, authentication and answersLocked
  ////////////////////////////////////////////////////////////////////

  #answersLocked = $derived(!!this.#appSettings.access.answersLocked);

  #idTokenClaims = $derived(page.data.claims ?? undefined);

  // userData composite producer — declared AFTER #answersLocked + #locale because the getter-thunks read them. The thunks are lazy, so this is safe.
  #userData = candidateUserDataState({
    answersLocked: () => this.#answersLocked,
    dataWriter: prepareDataWriter,
    locale: () => this.#locale
  });

  #newUserEmail = $state<string | undefined>(undefined);

  ////////////////////////////////////////////////////////////////////
  // Properties matching those in the VoterContext
  ////////////////////////////////////////////////////////////////////

  #electionsSelectable = $derived(this.#dataRoot.elections?.length !== 1);

  #constituenciesSelectable = $derived(this.#dataRoot.elections?.some((e) => !e.singleConstituency));

  // Persisted handles — imperative round-trip via `.current`/`.set`; NO $effect-driven init.
  #preregistrationElectionIds = sessionStorageState('candidateContext-preselectedElectionIds', new Array<Id>());

  #preregistrationConstituencyIds = sessionStorageState<{
    [electionId: Id]: Id;
  }>('candidateContext-preselectedConstituencyIds', {});

  #isPreregistered = localStorageState('candidateContext-isPreregistered', false);

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
  #questionBlocks = $state<QuestionBlocksShape>({
    blocks: [],
    get questions() {
      return [];
    },
    getByCategory: () => undefined,
    getByQuestion: () => undefined
  });

  ////////////////////////////////////////////////////////////////////
  // Other properties specific to CandidateContext
  ////////////////////////////////////////////////////////////////////

  #requiredInfoQuestions = $derived(
    this.#infoQuestions.filter((q) => {
      const customData = getCustomData(q);
      return q.required && !customData.locked;
    })
  );

  #unansweredRequiredInfoQuestions = $derived.by(() => {
    const savedData = this.#userData.savedCandidateData;
    if (!savedData) return this.#requiredInfoQuestions;
    return this.#requiredInfoQuestions.filter((q) => isEmptyValue(savedData.answers?.[q.id]?.value));
  });

  #unansweredOpinionQuestions = $derived.by(() => {
    const savedData = this.#userData.savedCandidateData;
    if (!savedData) return this.#opinionQuestions;
    return this.#opinionQuestions.filter((q) => isEmptyValue(savedData.answers?.[q.id]?.value));
  });

  #profileComplete = $derived(
    this.#unansweredRequiredInfoQuestions.length === 0 && this.#unansweredOpinionQuestions.length === 0
  );

  ////////////////////////////////////////////////////////////
  // Inherited appContext members (declared for `implements CandidateContext`; INSTALLED via `Object.assign(this, this.#appContext)` in the constructor from the own-enumerable AppContextProvider instance). Definite-assignment `!`.
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

  ////////////////////////////////////////////////////////////
  // Inherited authContext members (declared for `implements CandidateContext`; INSTALLED via `Object.assign(this, this.#authContext)` in the constructor from the own-enumerable AuthContextProvider instance). `logout` is NOT declared here — candidateContext overrides it via a prototype getter (below).
  ////////////////////////////////////////////////////////////

  readonly isAuthenticated!: AuthContext['isAuthenticated'];
  readonly requestForgotPasswordEmail!: AuthContext['requestForgotPasswordEmail'];
  readonly resetPassword!: AuthContext['resetPassword'];
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
    const { logout: _inheritedLogout, ...authContextRest } = this.#authContext;
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
        this.#selectedElections = removeDuplicates(
          current.nominations.nominations.map((n) => dr.getElection(n.electionId))
        );
      } catch (e) {
        log.error(`[candidateContext selectedElections] Error fetching election: ${e}`);
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
          current.nominations.nominations.map((n) => dr.getConstituency(n.constituencyId))
        );
      } catch (e) {
        log.error(`[candidateContext selectedConstituencies] Error fetching constituency: ${e}`);
        this.#selectedConstituencies = [];
      }
    });

    $effect(() => {
      const dr = this.#dataRoot;
      const elections = this.#selectedElections;
      const constituencies = this.#selectedConstituencies;
      const entityType = ENTITY_TYPE.Candidate;
      // `dr` was read above, inside this effect's tracking scope, and is handed to the shared rollup BY VALUE — never as a `$derived` alias and never as a thunk. See `../utils/questionRollup` for why either shape goes stale on cold entry.
      const {
        infoCategories: nextInfoCats,
        opinionCategories: nextOpinionCats,
        infoQuestions: nextInfoQuestions,
        opinionQuestions: nextOpinionQuestions
      } = rollUpQuestionCategories({ dataRoot: dr, elections, constituencies, entityType });
      // Blocks stay here: the candidate app builds them from every opinion category, the voter app from a filtered and reordered subset, so sharing them would be a parameterised branch rather than shared logic.
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
    });
  }

  ////////////////////////////////////////////////////////////////////
  // Wrappers for DataWriter methods (arrow fields — survive detach) NB. These automatically handle authentication See also userData which handles other methods
  ////////////////////////////////////////////////////////////////////

  // These are exported for convenience so that all relevant methods can be accessed via the context on the client-side.
  // NB. We have to repeat a lot of code bc of typing constraints
  checkRegistrationKey = (
    ...args: Parameters<DataWriter['checkRegistrationKey']>
  ): ReturnType<DataWriter['checkRegistrationKey']> => {
    return prepareDataWriter().checkRegistrationKey(...args);
  };

  register = (...args: Parameters<DataWriter['register']>): ReturnType<DataWriter['register']> => {
    return prepareDataWriter().register(...args);
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
        return await goto(this.#getRoute.current('CandAppPreregister'), { invalidateAll: true });
      }
    } catch (e) {
      log.error(`Error exchanging authorization code for ID token: ${e ?? '-'}`);
    }
    return await goto(
      this.#getRoute.current({
        route: 'CandAppPreregisterStatus',
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
          route: 'CandAppPreregisterStatus',
          code
        }),
        { invalidateAll: true }
      );
    } catch (e) {
      log.error(`Error preregistering a candidate: ${e ?? '-'}`);
    }
    return await goto(this.#getRoute.current({ route: 'CandAppPreregisterStatus', code: 'unknownError' }), {
      invalidateAll: true
    });
  };

  clearIdToken = async (): Promise<void> => {
    const dw = prepareDataWriter();
    await dw.clearIdToken().catch((e) => {
      log.error(`Error logging out: ${e?.message ?? '-'}`);
    });
  };

  ////////////////////////////////////////////////////////////////////
  // logout override (LANDMINE — see class JSDoc). `logout` wraps the inherited authContext logout with a post-logout goto + #reset. It is a PROTOTYPE GETTER delegating to a private `#logout` arrow: prototype members are NOT own-enumerable, so `Object.assign(this, this.#authContext)` does NOT overwrite it (whereas an arrow FIELD `logout` WOULD be clobbered, because field initializers run BEFORE the constructor body).
  ////////////////////////////////////////////////////////////////////

  get logout() {
    return this.#logout;
  }
  #logout = async (): Promise<void> => {
    await this.#authLogout();
    return goto(this.#getRoute.current('CandAppLogin'), { invalidateAll: true }).then(this.#reset);
  };

  /**
   * Utility for resetting all data. Note that `isAuthenticated` is not reset, because it's derived from `page.data.session`
   */
  #reset = (): void => {
    this.#userData.reset();
    this.#newUserEmail = undefined;
  };

  ////////////////////////////////////////////////////////////
  // Surface members (prototype get/set accessors — spread-safe). Reads via `ctx.X` re-invoke the getter in the tracking scope (destructure-trap contract).
  ////////////////////////////////////////////////////////////

  get answersLocked() {
    return this.#answersLocked;
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
  get newUserEmail() {
    return this.#newUserEmail;
  }
  set newUserEmail(v) {
    this.#newUserEmail = v;
  }
  get opinionQuestionCategories() {
    return this.#opinionQuestionCategories;
  }
  get opinionQuestions() {
    return this.#opinionQuestions;
  }
  get profileComplete() {
    return this.#profileComplete;
  }
  get questionBlocks() {
    return this.#questionBlocks;
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
  get preregistrationElections() {
    return this.#preregistrationElections;
  }
  get preregistrationNominations() {
    return this.#preregistrationNominations;
  }
}

export function getCandidateContext(): CandidateContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getCandidateContext() called before initCandidateContext()');
  return getContext<CandidateContext>(CONTEXT_KEY);
}

/**
 * Initialize and return the context. This must be called before `getGlobalContext()` and cannot be called twice.
 * @returns The context object
 */
export function initCandidateContext(): CandidateContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initCandidateContext() called for a second time');
  return setContext<CandidateContext>(CONTEXT_KEY, new CandidateContextProvider());
}
