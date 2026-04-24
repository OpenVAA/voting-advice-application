import { getCustomData } from '@openvaa/app-shared';
import { ENTITY_TYPE, isEmptyValue, QUESTION_CATEGORY_TYPE } from '@openvaa/data';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { fromStore } from 'svelte/store';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { logDebugError } from '$lib/utils/logger';
import { removeDuplicates } from '$lib/utils/removeDuplicates';
import { getImpliedElectionIds } from '$lib/utils/route';
import { candidateUserDataStore } from './candidateUserDataStore.svelte';
import { getAppContext } from '../app';
import { getAuthContext } from '../auth';
import { prepareDataWriter } from '../utils/prepareDataWriter';
import { localStorageWritable, sessionStorageWritable } from '../utils/persistedState.svelte';
import type { Id } from '@openvaa/core';
import type { AnyQuestionVariant, Constituency, Election, QuestionCategory } from '@openvaa/data';
import type { DataWriter } from '$lib/api/base/dataWriter.type';
import type { CandidateContext } from './candidateContext.type';

const CONTEXT_KEY = Symbol();

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

  ////////////////////////////////////////////////////////////
  // Inheritance from other Contexts
  ////////////////////////////////////////////////////////////

  const appContext = getAppContext();
  const { appSettings, getRoute, locale, reactiveDataRoot } = appContext;

  const authContext = getAuthContext();
  const { isAuthenticated, logout: _logout } = authContext;

  // Bridge store values to rune-compatible access
  const appSettingsState = fromStore(appSettings);
  const getRouteState = fromStore(getRoute);
  const localeState = fromStore(locale);

  ////////////////////////////////////////////////////////////////////
  // User data, authentication and answersLocked
  ////////////////////////////////////////////////////////////////////

  const answersLocked = $derived(!!appSettingsState.current.access.answersLocked);

  const idTokenClaims = $derived(page.data.claims ?? undefined);

  const userData = candidateUserDataStore({
    answersLocked: () => answersLocked,
    dataWriterPromise,
    locale: () => localeState.current
  });

  let newUserEmail = $state<string | undefined>(undefined);

  ////////////////////////////////////////////////////////////////////
  // Properties matching those in the VoterContext
  ////////////////////////////////////////////////////////////////////

  const electionsSelectable = $derived(reactiveDataRoot.current.elections?.length !== 1);

  const constituenciesSelectable = $derived(
    reactiveDataRoot.current.elections?.some((e) => !e.singleConstituency)
  );

  const _preregistrationElectionIds = sessionStorageWritable('candidateContext-preselectedElectionIds', new Array<Id>());
  const preregistrationElectionIdsState = fromStore(_preregistrationElectionIds);

  const _preregistrationConstituencyIds = sessionStorageWritable<{
    [electionId: Id]: Id;
  }>('candidateContext-preselectedConstituencyIds', {});
  const preregistrationConstituencyIdsState = fromStore(_preregistrationConstituencyIds);

  const preregistrationElections = $derived.by(() => {
    const settings = appSettingsState.current;
    const dr = reactiveDataRoot.current;
    const preregIds = preregistrationElectionIdsState.current;
    const ids = getImpliedElectionIds({ appSettings: settings, dataRoot: dr }) ?? preregIds;
    return ids.map((id) => dr.getElection(id));
  });

  const preregistrationNominations = $derived.by(() => {
    const constIds = preregistrationConstituencyIdsState.current;
    return preregistrationElections
      .map((e) => ({
        constituencyId: constIds[e.id] || e.singleConstituency?.id,
        electionId: e.id
      }))
      .filter(({ constituencyId }) => !!constituencyId) as Array<{
      electionId: Id;
      constituencyId: Id;
    }>;
  });

  // QUESTION-04 (Phase 61 Plan 03, Hypothesis A reactivity fix):
  // The pull-chain `$derived.by` pattern (via helper stores) did not propagate
  // reactive invalidation correctly to cross-module consumers — confirmed by
  // console trace (see 61-03-DIAGNOSIS.md): selectedElections/opinionQuestions
  // derivations evaluated ONCE at component-init with pre-data values and never
  // re-ran after the protected layout `$effect` populated dataRoot + userData.
  // Root mechanism: Svelte 5 tracks reactive reads from within a tracking scope,
  // but a DESTRUCTURED context-object property (`const { opinionQuestions } = ctx`)
  // captures the getter's INITIAL return value as a plain local binding — the
  // consumer's `$effect` reading `opinionQuestions.length` thereafter has no
  // live reactive source. The `$derived` chain did recompute internally, but
  // downstream reads via the destructured property saw only the pre-data snapshot.
  //
  // Fix: switch selectedElections/selectedConstituencies + downstream question
  // chain to push-based `$state` mirrors updated by a single `$effect`. `$state`
  // reads through context getters propagate correctly (verified in this plan).
  // Consumers that previously destructured now read `ctx.X` directly; inline
  // derivations replace the helper-store pull chain (helpers kept for voterContext).
  let selectedElections = $state<Array<Election>>([]);
  let selectedConstituencies = $state<Array<Constituency>>([]);

  $effect(() => {
    const dr = reactiveDataRoot.current;
    const current = userData.current;
    if (!current || !dr.elections?.length) {
      selectedElections = [];
      return;
    }
    try {
      selectedElections = removeDuplicates(
        current.nominations.nominations.map((n) => dr.getElection(n.electionId))
      );
    } catch (e) {
      logDebugError(`[candidateContext selectedElections] Error fetching election: ${e}`);
      selectedElections = [];
    }
  });

  $effect(() => {
    const dr = reactiveDataRoot.current;
    const current = userData.current;
    if (!current || !dr.constituencies?.length) {
      selectedConstituencies = [];
      return;
    }
    try {
      selectedConstituencies = removeDuplicates(
        current.nominations.nominations.map((n) => dr.getConstituency(n.constituencyId))
      );
    } catch (e) {
      logDebugError(`[candidateContext selectedConstituencies] Error fetching constituency: ${e}`);
      selectedConstituencies = [];
    }
  });

  /**
   * All applicable, non-empty question categories to be used as a base for the other stores.
   * QUESTION-04 (Phase 61 Plan 03): inlined the pull-chain helper-store derivations
   * into a single push-based `$effect` that writes `$state` mirrors. Behavior is
   * equivalent to `questionCategoryStore`/`questionStore`/`questionBlockStore` but
   * the consumer-facing reactivity works via context getters.
   */
  let _questionCategories = $state<Array<QuestionCategory>>([]);
  let _infoQuestionCategories = $state<Array<QuestionCategory>>([]);
  let _opinionQuestionCategories = $state<Array<QuestionCategory>>([]);
  let _infoQuestions = $state<Array<AnyQuestionVariant>>([]);
  let _opinionQuestions = $state<Array<AnyQuestionVariant>>([]);
  type QuestionBlocksShape = {
    blocks: Array<Array<AnyQuestionVariant>>;
    readonly questions: Array<AnyQuestionVariant>;
    getByCategory: (qc: { id: Id }) => { block: Array<AnyQuestionVariant>; index: number } | undefined;
    getByQuestion: (q: { id: Id }) => { block: Array<AnyQuestionVariant>; index: number; indexInBlock: number; indexOfBlock: number } | undefined;
  };
  let _questionBlocks = $state<QuestionBlocksShape>({
    blocks: [],
    get questions() { return []; },
    getByCategory: () => undefined,
    getByQuestion: () => undefined
  });

  $effect(() => {
    const dr = reactiveDataRoot.current;
    const elections = selectedElections;
    const constituencies = selectedConstituencies;
    const entityType = ENTITY_TYPE.Candidate;
    const nextQuestionCategories =
      dr.questionCategories?.filter(
        (c) =>
          c.appliesTo({ elections, constituencies, entityType }) &&
          c.getApplicableQuestions({ elections, constituencies, entityType }).length > 0
      ) ?? [];
    const nextInfoCats = nextQuestionCategories.filter(
      (qc) => qc.type !== QUESTION_CATEGORY_TYPE.Opinion
    );
    const nextOpinionCats = nextQuestionCategories.filter(
      (qc) => qc.type === QUESTION_CATEGORY_TYPE.Opinion
    );
    const nextInfoQuestions = nextInfoCats.flatMap((c) => {
      const questions = c.getApplicableQuestions({ elections, constituencies, entityType });
      if (c.type === QUESTION_CATEGORY_TYPE.Opinion && questions.some((q) => !q.isMatchable))
        error(500, `Some opinion questions in category ${c.id} is not matchable.`);
      return questions;
    });
    const nextOpinionQuestions = nextOpinionCats.flatMap((c) => {
      const questions = c.getApplicableQuestions({ elections, constituencies, entityType });
      if (c.type === QUESTION_CATEGORY_TYPE.Opinion && questions.some((q) => !q.isMatchable))
        error(500, `Some opinion questions in category ${c.id} is not matchable.`);
      return questions;
    });
    const nextBlocks = nextOpinionCats
      .map((c) => c.getApplicableQuestions({ elections, constituencies }))
      .filter((b) => b.length > 0);

    _questionCategories = nextQuestionCategories;
    _infoQuestionCategories = nextInfoCats;
    _opinionQuestionCategories = nextOpinionCats;
    _infoQuestions = nextInfoQuestions;
    _opinionQuestions = nextOpinionQuestions;
    _questionBlocks = {
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

  ////////////////////////////////////////////////////////////////////
  // Wrappers for DataWriter methods
  // NB. These automatically handle authentication
  // See also userData which handles other methods
  ////////////////////////////////////////////////////////////////////

  // These are exported for convenience so that all relevant methods can be accessed via the context on the client-side.
  // NB. We have to repeat a lot of code bc of typing constraints
  function checkRegistrationKey(
    ...args: Parameters<DataWriter['checkRegistrationKey']>
  ): ReturnType<DataWriter['checkRegistrationKey']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.checkRegistrationKey(...args));
  }
  function register(...args: Parameters<DataWriter['register']>): ReturnType<DataWriter['register']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.register(...args));
  }

  async function logout(): Promise<void> {
    await _logout();
    return goto(getRouteState.current('CandAppLogin'), { invalidateAll: true }).then(_reset);
  }

  async function exchangeCodeForIdToken(opts: {
    authorizationCode: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<void> {
    const dataWriter = await prepareDataWriter(dataWriterPromise);
    try {
      const result = await dataWriter.exchangeCodeForIdToken(opts);
      if (result.type === 'success') {
        return await goto(getRouteState.current('CandAppPreregister'), { invalidateAll: true });
      }
    } catch (e) {
      logDebugError(`Error exchanging authorization code for ID token: ${e ?? '-'}`);
    }
    return await goto(
      getRouteState.current({
        route: 'CandAppPreregisterStatus',
        code: 'strongIdentificationError'
      }),
      { invalidateAll: true }
    );
  }

  const _isPreregistered = localStorageWritable('candidateContext-isPreregistered', false);
  const isPreregisteredState = fromStore(_isPreregistered);

  async function preregister(opts: {
    email: string;
    nominations: Array<{ electionId: Id; constituencyId: Id }>;
    extra: {
      emailTemplate: {
        subject: string;
        text: string;
        html: string;
      };
    };
  }): Promise<void> {
    const dataWriter = await prepareDataWriter(dataWriterPromise);
    try {
      const result = await dataWriter.preregisterWithIdToken(opts);
      const errorMap: Record<number, string> = { 401: 'tokenExpiredError', 409: 'candidateExistsError' };
      let code: string;
      if (result.type === 'success') {
        _isPreregistered.set(true);
        code = 'success';
      } else {
        code = errorMap[result.response.status] ?? 'unknownError';
      }
      return await goto(
        getRouteState.current({
          route: 'CandAppPreregisterStatus',
          code
        }),
        { invalidateAll: true }
      );
    } catch (e) {
      logDebugError(`Error preregistering a candidate: ${e ?? '-'}`);
    }
    return await goto(getRouteState.current({ route: 'CandAppPreregisterStatus', code: 'unknownError' }), {
      invalidateAll: true
    });
  }

  async function clearIdToken(): Promise<void> {
    const dataWriter = await prepareDataWriter(dataWriterPromise);
    await dataWriter.clearIdToken().catch((e) => {
      logDebugError(`Error logging out: ${e?.message ?? '-'}`);
    });
  }

  /**
   * Utility for resetting all data. Note that `isAuthenticated` is not reset, because it's derived from `page.data.session`
   */
  function _reset(): void {
    userData.reset();
    newUserEmail = undefined;
  }

  ////////////////////////////////////////////////////////////////////
  // Other properties specific to CandidateContext
  ////////////////////////////////////////////////////////////////////

  const requiredInfoQuestions = $derived(
    _infoQuestions.filter((q) => {
      const customData = getCustomData(q);
      return !customData.locked && customData.required;
    })
  );

  const unansweredRequiredInfoQuestions = $derived.by(() => {
    const savedData = userData.savedCandidateData;
    if (!savedData) return [];
    return requiredInfoQuestions.filter((q) => isEmptyValue(savedData.answers?.[q.id]?.value));
  });

  const unansweredOpinionQuestions = $derived.by(() => {
    const savedData = userData.savedCandidateData;
    if (!savedData) return [];
    return _opinionQuestions.filter((q) => isEmptyValue(savedData.answers?.[q.id]?.value));
  });

  const profileComplete = $derived(
    unansweredRequiredInfoQuestions.length === 0 && unansweredOpinionQuestions.length === 0
  );

  ////////////////////////////////////////////////////////////
  // Build context
  ////////////////////////////////////////////////////////////

  return setContext<CandidateContext>(CONTEXT_KEY, {
    ...appContext,
    ...authContext,
    get answersLocked() {
      return answersLocked;
    },
    preregister,
    checkRegistrationKey,
    get constituenciesSelectable() {
      return constituenciesSelectable;
    },
    get selectedConstituencies() {
      return selectedConstituencies;
    },
    get selectedElections() {
      return selectedElections;
    },
    get electionsSelectable() {
      return electionsSelectable;
    },
    get infoQuestionCategories() {
      return _infoQuestionCategories;
    },
    get infoQuestions() {
      return _infoQuestions;
    },
    get isPreregistered() {
      return isPreregisteredState.current;
    },
    set isPreregistered(v) {
      _isPreregistered.set(v);
    },
    logout,
    get newUserEmail() {
      return newUserEmail;
    },
    set newUserEmail(v) {
      newUserEmail = v;
    },
    get opinionQuestionCategories() {
      return _opinionQuestionCategories;
    },
    get opinionQuestions() {
      return _opinionQuestions;
    },
    get profileComplete() {
      return profileComplete;
    },
    get questionBlocks() {
      return _questionBlocks;
    },
    register,
    get requiredInfoQuestions() {
      return requiredInfoQuestions;
    },
    get unansweredOpinionQuestions() {
      return unansweredOpinionQuestions;
    },
    get unansweredRequiredInfoQuestions() {
      return unansweredRequiredInfoQuestions;
    },
    userData,
    exchangeCodeForIdToken,
    get preregistrationElectionIds() {
      return preregistrationElectionIdsState.current;
    },
    set preregistrationElectionIds(v) {
      _preregistrationElectionIds.set(v);
    },
    get preregistrationConstituencyIds() {
      return preregistrationConstituencyIdsState.current;
    },
    set preregistrationConstituencyIds(v) {
      _preregistrationConstituencyIds.set(v);
    },
    clearIdToken,
    get idTokenClaims() {
      return idTokenClaims;
    },
    get preregistrationElections() {
      return preregistrationElections;
    },
    get preregistrationNominations() {
      return preregistrationNominations;
    }
  });
}
