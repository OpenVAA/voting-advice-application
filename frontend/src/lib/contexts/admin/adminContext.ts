import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { writable } from 'svelte/store';
import { getAppContext } from '../app';
import { getAuthContext } from '../auth';
import type { BasicUserData } from '$lib/api/base/dataWriter.type';
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

  const adminContext: AdminContext = {
    ...appContext,
    ...authContext,
    userData
  };

  setContext<AdminContext>(CONTEXT_KEY, adminContext);
  return adminContext;
}
