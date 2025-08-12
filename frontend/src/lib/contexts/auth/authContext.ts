import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { derived, get } from 'svelte/store';
import { page } from '$app/stores';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { logDebugError } from '$lib/utils/logger';
import { prepareDataWriter } from '../utils/prepareDataWriter';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { DataWriter } from '$lib/api/base/dataWriter.type';
import type { AuthContext } from './authContext.type';

const CONTEXT_KEY = Symbol();

export function getAuthContext(): AuthContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getAuthContext() called before initAuthContext()');
  return getContext<AuthContext>(CONTEXT_KEY);
}

/**
 * Initialize and return the context. This must be called before `getAuthContext()` and cannot be called twice.
 * @returns The context object
 */
export function initAuthContext(): AuthContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initAuthContext() called for a second time');

  const authToken = derived(page, (page) => page.data.token ?? undefined);

  ////////////////////////////////////////////////////////////////////
  // Wrappers for DataWriter methods
  // NB. These automatically handle authentication
  ////////////////////////////////////////////////////////////////////

  async function requestForgotPasswordEmail(
    ...args: Parameters<DataWriter['requestForgotPasswordEmail']>
  ): ReturnType<DataWriter['requestForgotPasswordEmail']> {
    const dw = await prepareDataWriter(dataWriterPromise);
    return dw.requestForgotPasswordEmail(...args);
  }

  async function resetPassword(
    ...args: Parameters<DataWriter['resetPassword']>
  ): ReturnType<DataWriter['resetPassword']> {
    const dw = await prepareDataWriter(dataWriterPromise);
    return dw.resetPassword(...args);
  }

  async function logout(): Promise<void> {
    const token = get(authToken);
    if (!token) throw new Error('No authentication token');
    const dataWriter = await prepareDataWriter(dataWriterPromise);
    await dataWriter.logout({ authToken: token }).catch((e) => {
      logDebugError(`Error logging out: ${e?.message ?? '-'}`);
    });
  }

  async function setPassword(opts: { currentPassword: string; password: string }): Promise<DataApiActionResult> {
    const token = get(authToken);
    if (!token) throw new Error('No authentication token');
    const dataWriter = await prepareDataWriter(dataWriterPromise);
    return dataWriter.setPassword({ ...opts, authToken: token });
  }

  ////////////////////////////////////////////////////////////
  // Build context
  ////////////////////////////////////////////////////////////

  return setContext<AuthContext>(CONTEXT_KEY, {
    authToken,
    logout,
    requestForgotPasswordEmail,
    resetPassword,
    setPassword
  });
}
