import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { writable } from 'svelte/store';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { jobStores } from './jobStores';
import { getAppContext } from '../app';
import { getAuthContext } from '../auth';
import { prepareDataWriter } from '../utils/prepareDataWriter';
import type { BasicUserData, DataWriter } from '$lib/api/base/dataWriter.type';
import type { AdminContext } from './adminContext.type';

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

  function updateQuestion(...args: Parameters<DataWriter['updateQuestion']>): ReturnType<DataWriter['updateQuestion']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.updateQuestion(...args));
  }

  function getActiveJobs(...args: Parameters<DataWriter['getActiveJobs']>): ReturnType<DataWriter['getActiveJobs']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.getActiveJobs(...args));
  }

  function getPastJobs(...args: Parameters<DataWriter['getPastJobs']>): ReturnType<DataWriter['getPastJobs']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.getPastJobs(...args));
  }

  function startJob(...args: Parameters<DataWriter['startJob']>): ReturnType<DataWriter['startJob']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.startJob(...args));
  }

  function getJobProgress(...args: Parameters<DataWriter['getJobProgress']>): ReturnType<DataWriter['getJobProgress']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.getJobProgress(...args));
  }

  function abortJob(...args: Parameters<DataWriter['abortJob']>): ReturnType<DataWriter['abortJob']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.abortJob(...args));
  }

  function abortAllJobs(...args: Parameters<DataWriter['abortAllJobs']>): ReturnType<DataWriter['abortAllJobs']> {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.abortAllJobs(...args));
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
    abortAllJobs
  };

  setContext<AdminContext>(CONTEXT_KEY, adminContext);
  return adminContext;
}
