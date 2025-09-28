import type { Writable } from 'svelte/store';
import type { BasicUserData, DataWriter } from '$lib/api/base/dataWriter.type';
import type { AppContext } from '../app';
import type { AuthContext } from '../auth';
import type { JobStores } from './jobStores.type';

export type AdminContext = AppContext &
  AuthContext & {
    /**
     * Store for user data
     */
    userData: Writable<BasicUserData | undefined>;
    /**
     * Stores and utilities for handling admin jobs.
     */
    jobs: JobStores;

    ////////////////////////////////////////////////////////////////////
    // Wrappers for DataWriter methods
    ////////////////////////////////////////////////////////////////////

    updateQuestion(
      opts: WithOptionalAuth<Parameters<DataWriter['updateQuestion']>[0]>
    ): ReturnType<DataWriter['updateQuestion']>;

    getActiveJobs(
      opts: WithOptionalAuth<Parameters<DataWriter['getActiveJobs']>[0]>
    ): ReturnType<DataWriter['getActiveJobs']>;

    getPastJobs(
      opts: WithOptionalAuth<Parameters<DataWriter['getPastJobs']>[0]>
    ): ReturnType<DataWriter['getPastJobs']>;

    startJob(opts: WithOptionalAuth<Parameters<DataWriter['startJob']>[0]>): ReturnType<DataWriter['startJob']>;

    getJobProgress(
      opts: WithOptionalAuth<Parameters<DataWriter['getJobProgress']>[0]>
    ): ReturnType<DataWriter['getJobProgress']>;

    abortJob(opts: WithOptionalAuth<Parameters<DataWriter['abortJob']>[0]>): ReturnType<DataWriter['abortJob']>;

    abortAllJobs(
      opts: WithOptionalAuth<Parameters<DataWriter['abortAllJobs']>[0]>
    ): ReturnType<DataWriter['abortAllJobs']>;

    insertJobResult(
      opts: WithOptionalAuth<Parameters<DataWriter['insertJobResult']>[0]>
    ): ReturnType<DataWriter['insertJobResult']>;
  };

export type WithOptionalAuth<TParams> = Omit<TParams, 'authToken'> & { authToken?: string };
