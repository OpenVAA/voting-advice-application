import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { page } from '$app/state';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { logDebugError } from '$lib/utils/logger';
import { prepareDataWriter } from '../utils/prepareDataWriter';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { DataWriter } from '$lib/api/base/dataWriter.type';
import type { AuthContext } from './authContext.type';

const CONTEXT_KEY = Symbol();

/**
 * The auth context as a Svelte 5 CLASS (Group F leaf; v2.13 context-as-class
 * migration, CLASS-02). CONVERTED from the factory closure that returned a
 * `setContext` object literal inside `initAuthContext()`.
 *
 * `isAuthenticated` is a PUBLIC `$derived` FIELD reading `page.data.session`
 * (§17: a `$derived` field read as `instance.isAuthenticated` stays reactive —
 * "public $derived field — spread-safe own property"). It is deliberately a
 * public field, NOT a private `#field` + prototype getter: candidateContext
 * spreads the instance via `{ ...authContext }` and a prototype getter would be
 * dropped by the spread (spread copies only own-enumerable properties). A public
 * `$derived` field is an own-enumerable property, so it survives the spread AND
 * satisfies the `readonly boolean` interface member structurally.
 *
 * The four DataWriter wrappers (`logout` / `requestForgotPasswordEmail` /
 * `resetPassword` / `setPassword`) are ARROW-FUNCTION FIELDS (§18 — they survive
 * detach: candidateContext does `const { logout: _logout } = authContext`) so
 * they capture `this`. Their bodies are preserved verbatim from the former
 * async-function declarations, including the `prepareDataWriter(dataWriterPromise)`
 * await and the `authToken: ''` cookie-auth stub.
 *
 * There is NO init/post-mount effect (§20): the `page.data.session` read is
 * synchronous via `$derived`.
 */
class AuthContextProvider implements AuthContext {
  // §17 — public $derived field — spread-safe own property (candidateContext `{ ...authContext }`).
  isAuthenticated = $derived(!!page.data.session);

  ////////////////////////////////////////////////////////////////////
  // Wrappers for DataWriter methods (§18 arrow fields — survive detach)
  // NB. These automatically handle authentication via Supabase sessions.
  // authToken is passed as '' to satisfy the WithAuth type constraint --
  // the Supabase adapter ignores it (auth is cookie-based).
  ////////////////////////////////////////////////////////////////////

  requestForgotPasswordEmail = async (
    ...args: Parameters<DataWriter['requestForgotPasswordEmail']>
  ): ReturnType<DataWriter['requestForgotPasswordEmail']> => {
    const dw = await prepareDataWriter(dataWriterPromise);
    return dw.requestForgotPasswordEmail(...args);
  };

  resetPassword = async (
    ...args: Parameters<DataWriter['resetPassword']>
  ): ReturnType<DataWriter['resetPassword']> => {
    const dw = await prepareDataWriter(dataWriterPromise);
    return dw.resetPassword(...args);
  };

  logout = async (): Promise<void> => {
    const dataWriter = await prepareDataWriter(dataWriterPromise);
    await dataWriter.logout({ authToken: '' }).catch((e) => {
      logDebugError(`Error logging out: ${e?.message ?? '-'}`);
    });
  };

  setPassword = async (opts: { password: string }): Promise<DataApiActionResult> => {
    const dataWriter = await prepareDataWriter(dataWriterPromise);
    return dataWriter.setPassword({ ...opts, authToken: '', currentPassword: '' });
  };
}

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

  return setContext<AuthContext>(CONTEXT_KEY, new AuthContextProvider());
}
