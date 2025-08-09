// External imports
import { getContext, setContext } from 'svelte';
import { derived, type Readable, type Writable, writable } from 'svelte/store';
import { page } from '$app/stores';

const ADMIN_CONTEXT_KEY = Symbol('admin');

/**
 * Admin user data structure
 */
export interface AdminUserData {
  id: string;
  username: string;
  email: string;
  [key: string]: unknown;
}

export interface AdminContext {
  /**
   * Holds the jwt token.
   */
  authToken: Readable<string | undefined>;

  /**
   * Store for user data
   */
  userData: Writable<AdminUserData | undefined>;
}

export function initAdminContext(): AdminContext {
  // Derive authToken from page data
  const authToken = derived(page, (page) => page.data.token);

  // Create a store for user data
  const userData = writable<AdminUserData | undefined>(undefined);

  const adminContext: AdminContext = {
    authToken,
    userData
  };

  setContext<AdminContext>(ADMIN_CONTEXT_KEY, adminContext);
  return adminContext;
}

export function getAdminContext(): AdminContext {
  return getContext<AdminContext>(ADMIN_CONTEXT_KEY);
}
