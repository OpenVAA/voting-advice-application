import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { page } from '$app/state';
import { dataWriter } from '$lib/api/dataWriter';
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
 * `isAuthenticated` is backed by a private `#isAuthenticated = $derived(...)`
 * field reading `page.data.session`, exposed as an OWN-ENUMERABLE accessor
 * assigned in the constructor (the canonical spread-safety shape from
 * `dataContext`'s constructor-assigned own-property handles). Read as
 * `instance.isAuthenticated` it is fully reactive (the getter re-invokes the
 * `$derived` inside the tracking scope).
 *
 * NB. A bare public `$derived` class field would NOT survive the
 * `{ ...authContext }` spread in candidateContext: Svelte 5 compiles `$state`/
 * `$derived` class fields to PRIVATE backing fields + PROTOTYPE accessors, which
 * are NOT own-enumerable and are therefore dropped by object spread (verified
 * headlessly). The original object-literal `get isAuthenticated()` WAS an
 * own-enumerable accessor, so the spread copied it (as a snapshot — the
 * documented spread-of-context trap, CONVENTIONS Spike 009/019). To stay
 * byte-identical at the consumer until the Phase 109 spread-of-context fix,
 * `isAuthenticated` MUST remain own-enumerable. Hence the constructor-assigned
 * accessor rather than a bare `$derived` field.
 *
 * The four DataWriter wrappers (`logout` / `requestForgotPasswordEmail` /
 * `resetPassword` / `setPassword`) are ARROW-FUNCTION FIELDS (§18 — they survive
 * detach: candidateContext does `const { logout: _logout } = authContext`) so
 * they capture `this`. Their bodies are preserved verbatim from the former
 * async-function declarations, including the `prepareDataWriter(dataWriter)`
 * await and the `authToken: ''` cookie-auth stub.
 *
 * There is NO init/post-mount effect (§20): the `page.data.session` read is
 * synchronous via `$derived`.
 */
export class AuthContextProvider implements AuthContext {
  // §17/§D — private $derived backing field; exposed as an OWN-ENUMERABLE accessor
  // (assigned in the constructor) so it survives the candidateContext spread.
  #isAuthenticated = $derived(!!page.data.session);

  // Own-enumerable `isAuthenticated` accessor (spread-safe). Declared here so the
  // type is `readonly boolean`; the actual getter is installed in the constructor.
  readonly isAuthenticated!: boolean;

  constructor() {
    // Define `isAuthenticated` as an OWN-ENUMERABLE getter (not a prototype
    // accessor) so `{ ...authContext }` copies it (dataContext spread-safety
    // precedent). Reading `instance.isAuthenticated` re-invokes `#isAuthenticated`
    // in the tracking scope, so the read stays reactive.
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- the defineProperty getter below has its own `this`; `self` captures the instance to reach the private `#isAuthenticated` backing (spread-safe class-conversion pattern).
    const self = this;
    Object.defineProperty(this, 'isAuthenticated', {
      enumerable: true,
      configurable: true,
      get(): boolean {
        return self.#isAuthenticated;
      }
    });
  }

  ////////////////////////////////////////////////////////////////////
  // Wrappers for DataWriter methods (§18 arrow fields — survive detach)
  // NB. These automatically handle authentication via Supabase sessions.
  // authToken is passed as '' to satisfy the WithAuth type constraint --
  // the Supabase adapter ignores it (auth is cookie-based).
  ////////////////////////////////////////////////////////////////////

  requestForgotPasswordEmail = async (
    ...args: Parameters<DataWriter['requestForgotPasswordEmail']>
  ): ReturnType<DataWriter['requestForgotPasswordEmail']> => {
    const dw = await prepareDataWriter(dataWriter);
    return dw.requestForgotPasswordEmail(...args);
  };

  resetPassword = async (...args: Parameters<DataWriter['resetPassword']>): ReturnType<DataWriter['resetPassword']> => {
    const dw = await prepareDataWriter(dataWriter);
    return dw.resetPassword(...args);
  };

  logout = async (): Promise<void> => {
    const dw = await prepareDataWriter(dataWriter);
    await dw.logout({ authToken: '' }).catch((e) => {
      logDebugError(`Error logging out: ${e?.message ?? '-'}`);
    });
  };

  setPassword = async (opts: { currentPassword?: string; password: string }): Promise<DataApiActionResult> => {
    const dw = await prepareDataWriter(dataWriter);
    // Behavior-neutral: the Supabase `_setPassword` ignores currentPassword — the active
    // session is verified via cookies, not the old password (Pitfall 1). Default to '' for
    // the register/reset flows that omit it (mirrors the former hardcoded currentPassword: '').
    return dw.setPassword({ password: opts.password, currentPassword: opts.currentPassword ?? '', authToken: '' });
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
