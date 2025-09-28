import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { get, writable } from 'svelte/store';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { jobStores } from './jobStores';
import { getAppContext } from '../app';
import { getAuthContext } from '../auth';
import { prepareDataWriter } from '../utils/prepareDataWriter';
import type { BasicUserData, DataWriter, WithAuth } from '$lib/api/base/dataWriter.type';
import type { AdminContext, WithOptionalAuth } from './adminContext.type';

const CONTEXT_KEY = Symbol('admin');

export function getAdminContext(): AdminContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getAdminContext() called before initAdminContext()');
  return getContext<AdminContext>(CONTEXT_KEY);
}

export function initAdminContext(): AdminContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initAdminContext() called for a second time');

  ////////////////////////////////////////////////////////////
  // Inheritance from other Contexts
  ////////////////////////////////////////////////////////////

  const appContext = getAppContext();
  const authContext = getAuthContext();
  const { authToken } = authContext;

  ////////////////////////////////////////////////////////////////////
  // Common contents
  ////////////////////////////////////////////////////////////////////

  const userData = writable<BasicUserData | undefined>(undefined);

  ////////////////////////////////////////////////////////////////////
  // Admin functions
  ////////////////////////////////////////////////////////////////////

  const jobs = jobStores();

  ////////////////////////////////////////////////////////////////////
  // Wrappers for DataWriter methods
  // NB. These automatically handle authentication
  ////////////////////////////////////////////////////////////////////

  /**
   * Inject the JWT token into requests.
   * TODO: Refactor `DataWriter` so that we can cache the `authToken` in the instance.
   */
  function injectAuthToken<TParams extends { authToken?: string }>(opts: TParams): TParams & WithAuth {
    return { authToken: get(authToken)!, ...opts };
  }

  function updateQuestion(
    opts: WithOptionalAuth<Parameters<DataWriter['updateQuestion']>[0]>
  ): ReturnType<DataWriter['updateQuestion']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.updateQuestion(injectAuthToken(opts)));
  }

  function getActiveJobs(
    opts: WithOptionalAuth<Parameters<DataWriter['getActiveJobs']>[0]>
  ): ReturnType<DataWriter['getActiveJobs']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.getActiveJobs(injectAuthToken(opts)));
  }

  function getPastJobs(
    opts: WithOptionalAuth<Parameters<DataWriter['getPastJobs']>[0]>
  ): ReturnType<DataWriter['getPastJobs']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.getPastJobs(injectAuthToken(opts)));
  }

  function startJob(opts: WithOptionalAuth<Parameters<DataWriter['startJob']>[0]>): ReturnType<DataWriter['startJob']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.startJob(injectAuthToken(opts)));
  }

  function getJobProgress(
    opts: WithOptionalAuth<Parameters<DataWriter['getJobProgress']>[0]>
  ): ReturnType<DataWriter['getJobProgress']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.getJobProgress(injectAuthToken(opts)));
  }

  function abortJob(opts: WithOptionalAuth<Parameters<DataWriter['abortJob']>[0]>): ReturnType<DataWriter['abortJob']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.abortJob(injectAuthToken(opts)));
  }

  function abortAllJobs(
    opts: WithOptionalAuth<Parameters<DataWriter['abortAllJobs']>[0]>
  ): ReturnType<DataWriter['abortAllJobs']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.abortAllJobs(injectAuthToken(opts)));
  }

  function insertJobResult(
    opts: WithOptionalAuth<Parameters<DataWriter['insertJobResult']>[0]>
  ): ReturnType<DataWriter['insertJobResult']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.insertJobResult(injectAuthToken(opts)));
  }

  const adminContext: AdminContext = {
    ...appContext,
    ...authContext,
    userData,
    jobs,
    updateQuestion,
    getActiveJobs,
    getPastJobs,
    startJob,
    getJobProgress,
    abortJob,
    abortAllJobs,
    insertJobResult
  };

  setContext<AdminContext>(CONTEXT_KEY, adminContext);
  return adminContext;
}
