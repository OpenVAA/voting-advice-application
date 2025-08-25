import type { Writable } from 'svelte/store';
import type { BasicUserData } from '$lib/api/base/dataWriter.type';
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
  };
