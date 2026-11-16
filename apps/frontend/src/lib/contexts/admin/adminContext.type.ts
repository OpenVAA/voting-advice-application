import type { createAdminWriter } from '$lib/api/adminWriter';
import type { BasicUserData, DataWriter } from '$lib/api/base/dataWriter.type';
import type { AppContext } from '../app';
import type { AuthContext } from '../auth';
import type { JobStates } from './jobStates.type';

/**
 * The admin writer these wrappers forward to, named by the factory that builds one per call rather than by any instance.
 */
type AdminWriter = ReturnType<typeof createAdminWriter>;

export type AdminContext = AppContext &
  AuthContext & {
    /**
     * User data for the admin user.
     */
    userData: BasicUserData | undefined;
    /**
     * Stores and utilities for handling admin jobs.
     */
    jobs: JobStates;

    ////////////////////////////////////////////////////////////////////
    // Wrappers for writer methods. `updateQuestion` and `insertJobResult` are admin-writer methods; the rest are DataWriter methods.
    ////////////////////////////////////////////////////////////////////

    updateQuestion(opts: Parameters<AdminWriter['updateQuestion']>[0]): ReturnType<AdminWriter['updateQuestion']>;

    getActiveJobs(opts: Parameters<DataWriter['getActiveJobs']>[0]): ReturnType<DataWriter['getActiveJobs']>;

    getPastJobs(opts: Parameters<DataWriter['getPastJobs']>[0]): ReturnType<DataWriter['getPastJobs']>;

    startJob(opts: Parameters<DataWriter['startJob']>[0]): ReturnType<DataWriter['startJob']>;

    getJobProgress(opts: Parameters<DataWriter['getJobProgress']>[0]): ReturnType<DataWriter['getJobProgress']>;

    abortJob(opts: Parameters<DataWriter['abortJob']>[0]): ReturnType<DataWriter['abortJob']>;

    abortAllJobs(): ReturnType<DataWriter['abortAllJobs']>;

    insertJobResult(opts: Parameters<AdminWriter['insertJobResult']>[0]): ReturnType<AdminWriter['insertJobResult']>;
  };
