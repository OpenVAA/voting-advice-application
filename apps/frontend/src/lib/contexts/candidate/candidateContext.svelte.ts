import { getCustomData } from '@openvaa/app-shared';
import { ENTITY_TYPE, isEmptyValue } from '@openvaa/data';
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
import { questionBlockStore } from '../utils/questionBlockStore.svelte';
import { extractInfoCategories, extractOpinionCategories, questionCategoryStore } from '../utils/questionCategoryStore.svelte';
import { questionStore } from '../utils/questionStore.svelte';
import { localStorageWritable, sessionStorageWritable } from '../utils/persistedState.svelte';
import type { Id } from '@openvaa/core';
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

  const selectedElections = $derived.by(() => {
    const dr = reactiveDataRoot.current;
    const current = userData.current;
    if (!current) return [];
    return removeDuplicates(current.nominations.nominations.map((n) => dr.getElection(n.electionId)));
  });

  const selectedConstituencies = $derived.by(() => {
    const dr = reactiveDataRoot.current;
    const current = userData.current;
    if (!current) return [];
    return removeDuplicates(current.nominations.nominations.map((n) => dr.getConstituency(n.constituencyId)));
  });

  /**
   * All applicable, non-empty question categories to be used as a base for the other stores.
   * TODO: Reverse the order of these stores, because `questionStore` filters out some questions. We should construct the categories only after filtering all questions.
   */
  const _questionCategories = questionCategoryStore({
    dataRoot: () => reactiveDataRoot.current,
    selectedElections: () => selectedElections,
    selectedConstituencies: () => selectedConstituencies,
    entityType: ENTITY_TYPE.Candidate
  });

  const _infoQuestionCategories = extractInfoCategories(() => _questionCategories.value);

  const _opinionQuestionCategories = extractOpinionCategories(() => _questionCategories.value);

  const _infoQuestions = questionStore({
    categories: () => _infoQuestionCategories.value,
    selectedElections: () => selectedElections,
    selectedConstituencies: () => selectedConstituencies,
    appType: 'candidate'
  });

  const _opinionQuestions = questionStore({
    categories: () => _opinionQuestionCategories.value,
    selectedElections: () => selectedElections,
    selectedConstituencies: () => selectedConstituencies,
    appType: 'candidate'
  });

  const _questionBlocks = questionBlockStore({
    opinionQuestionCategories: () => _opinionQuestionCategories.value,
    selectedElections: () => selectedElections,
    selectedConstituencies: () => selectedConstituencies
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
    _infoQuestions.value.filter((q) => {
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
    return _opinionQuestions.value.filter((q) => isEmptyValue(savedData.answers?.[q.id]?.value));
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
      return _infoQuestionCategories.value;
    },
    get infoQuestions() {
      return _infoQuestions.value;
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
      return _opinionQuestionCategories.value;
    },
    get opinionQuestions() {
      return _opinionQuestions.value;
    },
    get profileComplete() {
      return profileComplete;
    },
    get questionBlocks() {
      return _questionBlocks.value;
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
