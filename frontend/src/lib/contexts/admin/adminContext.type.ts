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

    /**
     * Update a Question's custom data.
     */
    updateQuestion: DataWriter['updateQuestion'];
    /**
     * Get currently active jobs.
     */
    getActiveJobs: DataWriter['getActiveJobs'];
    /**
     * Get past jobs with optional filtering.
     */
    getPastJobs: DataWriter['getPastJobs'];
    /**
     * Start a new job.
     */
    startJob: DataWriter['startJob'];
    /**
     * Get progress of a specific job.
     */
    getJobProgress: DataWriter['getJobProgress'];
    /**
     * Abort a specific job.
     */
    abortJob: DataWriter['abortJob'];
    /**
     * Abort all running jobs.
     */
    abortAllJobs: DataWriter['abortAllJobs'];
    /**
     * Insert a new job result.
     */
    insertJobResult: DataWriter['insertJobResult'];
  };
