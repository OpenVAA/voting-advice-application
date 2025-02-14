import { isEmptyValue } from '@openvaa/data';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { derived, get, writable } from 'svelte/store';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { logDebugError } from '$lib/utils/logger';
import { removeDuplicates } from '$lib/utils/removeDuplicates';
import { getImpliedElectionIds } from '$lib/utils/route';
import { prepareDataWriter } from './prepareDataWriter';
import { userDataStore } from './userDataStore';
import { getAppContext } from '../app';
import { questionBlockStore } from '../utils/questionBlockStore';
import { extractInfoCategories, extractOpinionCategories, questionCategoryStore } from '../utils/questionCategoryStore';
import { questionStore } from '../utils/questionStore';
import { sessionStorageWritable } from '../utils/storageStore';
import type { CustomData } from '@openvaa/app-shared';
import type { Id } from '@openvaa/core';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
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
  const { appSettings, dataRoot, getRoute, locale } = appContext;

  ////////////////////////////////////////////////////////////////////
  // User data, authentication and answersLocked
  ////////////////////////////////////////////////////////////////////

  const answersLocked = derived(appSettings, (appSettings) => !!appSettings.answersLocked);

  const authToken = derived(page, (page) => page.data.token ?? undefined);

  const idTokenClaims = derived(page, (page) => page.data.claims ?? undefined);

  const userData = userDataStore({ answersLocked, authToken, dataWriterPromise, locale });

  const newUserEmail = writable<string | undefined>();

  ////////////////////////////////////////////////////////////////////
  // Properties matching those in the VoterContext
  ////////////////////////////////////////////////////////////////////

  const electionsSelectable = derived(dataRoot, (dataRoot) => dataRoot.elections?.length !== 1);

  const constituenciesSelectable = derived(dataRoot, (dataRoot) =>
    dataRoot.elections?.some((e) => !e.singleConstituency)
  );

  const preregistrationElectionIds = sessionStorageWritable('candidateContext-preselectedElectionIds', new Array<Id>());

  const preregistrationConstituencyIds = sessionStorageWritable<{
    [electionId: Id]: Id;
  }>('candidateContext-preselectedConstituencyIds', {});

  const preregistrationElections = derived(
    [appSettings, dataRoot, preregistrationElectionIds],
    ([appSettings, dataRoot, preregistrationElectionIds]) => {
      const ids = getImpliedElectionIds({ appSettings, elections: dataRoot.elections }) ?? preregistrationElectionIds;
      return ids.map((id) => dataRoot.getElection(id));
    }
  );

  const preregistrationNominations = derived(
    [preregistrationElections, preregistrationConstituencyIds],
    ([preregistrationElections, preregistrationConstituencyIds]) => {
      return preregistrationElections
        .map((e) => ({
          constituencyId: preregistrationConstituencyIds[e.id] || e.singleConstituency?.id,
          electionId: e.id
        }))
        .filter(({ constituencyId }) => !!constituencyId) as Array<{
        electionId: Id;
        constituencyId: Id;
      }>;
    }
  );

  const selectedElections = derived(
    [dataRoot, userData],
    ([dataRoot, userData]) => {
      if (!userData) return [];
      return removeDuplicates(userData.nominations.nominations.map((n) => dataRoot.getElection(n.electionId)));
    },
    []
  );

  const selectedConstituencies = derived(
    [dataRoot, userData],
    ([dataRoot, userData]) => {
      if (!userData) return [];
      return removeDuplicates(userData.nominations.nominations.map((n) => dataRoot.getConstituency(n.constituencyId)));
    },
    []
  );

  /**
   * All applicable, non-empty question categories to be used as a base for the other stores.
   */
  const questionCategories = questionCategoryStore({ dataRoot, selectedElections, selectedConstituencies });

  const infoQuestionCategories = extractInfoCategories(questionCategories);

  const opinionQuestionCategories = extractOpinionCategories(questionCategories);

  const infoQuestions = questionStore({
    categories: infoQuestionCategories,
    selectedElections,
    selectedConstituencies
  });

  const opinionQuestions = questionStore({
    categories: opinionQuestionCategories,
    selectedElections,
    selectedConstituencies
  });

  const questionBlocks = questionBlockStore({
    opinionQuestionCategories,
    selectedElections,
    selectedConstituencies
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
  function requestForgotPasswordEmail(
    ...args: Parameters<DataWriter['requestForgotPasswordEmail']>
  ): ReturnType<DataWriter['requestForgotPasswordEmail']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.requestForgotPasswordEmail(...args));
  }
  function resetPassword(...args: Parameters<DataWriter['resetPassword']>): ReturnType<DataWriter['resetPassword']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.resetPassword(...args));
  }

  async function logout(): Promise<void> {
    const token = get(authToken);
    if (!token) throw new Error('No authentication token');
    const dataWriter = await prepareDataWriter(dataWriterPromise);
    await dataWriter.logout({ authToken: token }).catch((e) => {
      logDebugError(`Error logging out: ${e?.message ?? '-'}`);
    });
    _reset();
    return goto(get(getRoute)('CandAppLogin'), { invalidateAll: true });
  }

  async function setPassword(opts: { currentPassword: string; password: string }): Promise<DataApiActionResult> {
    const token = get(authToken);
    if (!token) throw new Error('No authentication token');
    const dataWriter = await prepareDataWriter(dataWriterPromise);
    return dataWriter.setPassword({ ...opts, authToken: token });
  }

  async function exchangeCodeForIdToken(opts: { authorizationCode: string; redirectUri: string }): Promise<void> {
    const dataWriter = await prepareDataWriter(dataWriterPromise);
    try {
      const result = await dataWriter.exchangeCodeForIdToken(opts);
      if (result.type === 'success') {
        return await goto(get(getRoute)('CandAppPreregister'), { invalidateAll: true });
      }
    } catch (e) {
      logDebugError(`Error exchanging authorization code for ID token: ${e ?? '-'}`);
    }
    return await goto(
      get(getRoute)({
        route: 'CandAppPreregisterStatus',
        code: 'strongIdentificationError'
      }),
      { invalidateAll: true }
    );
  }

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
      return await goto(
        get(getRoute)({
          route: 'CandAppPreregisterStatus',
          code: result.type === 'success' ? 'success' : (errorMap[result.response.status] ?? 'unknownError')
        }),
        { invalidateAll: true }
      );
    } catch (e) {
      logDebugError(`Error preregistering a candidate: ${e ?? '-'}`);
    }
    return await goto(get(getRoute)({ route: 'CandAppPreregisterStatus', code: 'unknownError' }), {
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
   * Utility for resetting all data. Note that `authToken` is not reset, becaue it's derived from `page.data.token`
   */
  function _reset(): void {
    userData.reset();
    newUserEmail.set(undefined);
  }

  ////////////////////////////////////////////////////////////////////
  // Other properties specific to CandidateContext
  ////////////////////////////////////////////////////////////////////

  const { savedCandidateData } = userData;

  const requiredInfoQuestions = derived(infoQuestions, (infoQuestions) =>
    infoQuestions.filter((q) => (q.customData as CustomData['Question'])?.required)
  );

  const unansweredRequiredInfoQuestions = derived(
    [requiredInfoQuestions, savedCandidateData],
    ([requiredInfoQuestions, savedCandidateData]) => {
      if (!savedCandidateData) return [];
      return requiredInfoQuestions.filter((q) => isEmptyValue(savedCandidateData.answers?.[q.id]?.value));
    }
  );

  const unansweredOpinionQuestions = derived(
    [opinionQuestions, savedCandidateData],
    ([opinionQuestions, savedCandidateData]) => {
      if (!savedCandidateData) return [];
      return opinionQuestions.filter((q) => isEmptyValue(savedCandidateData.answers?.[q.id]?.value));
    }
  );

  const profileComplete = derived(
    [unansweredRequiredInfoQuestions, unansweredOpinionQuestions],
    ([unansweredRequiredInfoQuestions, unansweredOpinionQuestions]) =>
      unansweredRequiredInfoQuestions.length === 0 && unansweredOpinionQuestions.length === 0
  );

  ////////////////////////////////////////////////////////////
  // Build context
  ////////////////////////////////////////////////////////////

  return setContext<CandidateContext>(CONTEXT_KEY, {
    ...appContext,
    answersLocked,
    authToken,
    preregister,
    checkRegistrationKey,
    constituenciesSelectable,
    selectedConstituencies,
    selectedElections,
    electionsSelectable,
    infoQuestionCategories,
    infoQuestions,
    logout,
    newUserEmail,
    opinionQuestionCategories,
    opinionQuestions,
    profileComplete,
    questionBlocks,
    register,
    requestForgotPasswordEmail,
    requiredInfoQuestions,
    resetPassword,
    setPassword,
    unansweredOpinionQuestions,
    unansweredRequiredInfoQuestions,
    userData,
    exchangeCodeForIdToken,
    preregistrationElectionIds,
    preregistrationConstituencyIds,
    clearIdToken,
    idTokenClaims,
    preregistrationElections,
    preregistrationNominations
  });
}
