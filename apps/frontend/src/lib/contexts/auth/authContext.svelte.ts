import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { page } from '$app/state';
import { announceLogout } from '$lib/auth/logoutAnnouncement';
import { withdrawAnyCount } from '$lib/auth/logoutDeadline';
import { prepareDataWriter } from '../utils/prepareDataWriter';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { AuthContext } from './authContext.type';

const CONTEXT_KEY = Symbol();

/**
 * The auth context as a Svelte 5 CLASS.
 *
 * `isAuthenticated` is backed by a private `#isAuthenticated = $derived(...)`
 * field reading `page.data.session`, exposed as an OWN-ENUMERABLE accessor assigned in the constructor (the canonical spread-safety shape from `dataContext`'s constructor-assigned own-property handles). Read as `instance.isAuthenticated` it is fully reactive (the getter re-invokes the `$derived` inside the tracking scope).
 *
 * NB. A bare public `$derived` class field would NOT survive the `{ ...authContext }` spread in contestantContext: Svelte 5 compiles `$state`/ `$derived` class fields to PRIVATE backing fields + PROTOTYPE accessors, which are NOT own-enumerable and are therefore dropped by object spread (verified headlessly). An own-enumerable accessor IS copied by the spread — as a snapshot, which is the documented spread-of-context trap. For the consumer to see the member at all, `isAuthenticated` MUST remain own-enumerable. Hence the constructor-assigned accessor rather than a bare `$derived` field.
 *
 * The two DataWriter wrappers (`logout` / `setPassword`) and `clearLogoutFailure` are ARROW-FUNCTION FIELDS (they survive detach: contestantContext does `const { logout: _logout } = authContext`) so they capture `this`. Each body builds its own writer with `prepareDataWriter()` for the one call it makes; authorisation is carried by the Supabase session cookie.
 *
 * `logoutFailed` is whether the last Log out's sign-out failed, which each app's layout tells the user. It is backed by a private `#logoutFailed = $state(...)` and installed as an own-enumerable accessor as `isAuthenticated` is, so an app context forwards it rather than copying it. `logout` clears it as it starts and sets it when the sign-out rejects, and `clearLogoutFailure` clears it.
 *
 * `logout` is the Log out of both apps, and before its sign-out request it withdraws every count of the logout modal the browser holds, whoever wrote it, so that a count a closed tab left cannot end a session signed in after this Log out. Then, still before the request, it announces its `start` to the browser's other tabs, and once the sign-out has settled, worked or failed, its `end`; those tabs name another tab as the cause of the sign-out they follow only after hearing them. A Log out whose request fails has still posted both, and a tab that hears them and meets no sign-out within the window after the `end` does nothing with them.
 *
 * There is NO init/post-mount effect: the `page.data.session` read is synchronous via `$derived`.
 */
export class AuthContextProvider implements AuthContext {
  // Private $derived backing field; exposed as an OWN-ENUMERABLE accessor (assigned in the constructor) so it survives the contestantContext spread.
  #isAuthenticated = $derived(!!page.data.session);

  // Own-enumerable `isAuthenticated` accessor (spread-safe). Declared here so the type is `readonly boolean`; the actual getter is installed in the constructor.
  readonly isAuthenticated!: boolean;

  // Whether the last Log out's sign-out failed; exposed as an own-enumerable accessor like `isAuthenticated`.
  #logoutFailed = $state(false);

  readonly logoutFailed!: boolean;

  constructor() {
    // Define `isAuthenticated` as an OWN-ENUMERABLE getter (not a prototype accessor) so `{ ...authContext }` copies it (dataContext spread-safety precedent). Reading `instance.isAuthenticated` re-invokes `#isAuthenticated` in the tracking scope, so the read stays reactive.
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- the defineProperty getter below has its own `this`; `self` captures the instance to reach the private `#isAuthenticated` backing (spread-safe class-conversion pattern).
    const self = this;
    Object.defineProperty(this, 'isAuthenticated', {
      enumerable: true,
      configurable: true,
      get(): boolean {
        return self.#isAuthenticated;
      }
    });
    Object.defineProperty(this, 'logoutFailed', {
      enumerable: true,
      configurable: true,
      get(): boolean {
        return self.#logoutFailed;
      }
    });
  }

  ////////////////////////////////////////////////////////////////////
  // Wrappers for DataWriter methods (arrow fields — survive detach) NB. These automatically handle authentication via Supabase sessions.
  ////////////////////////////////////////////////////////////////////

  logout = async (): Promise<void> => {
    this.#logoutFailed = false;
    withdrawAnyCount();
    announceLogout('start');
    try {
      const dw = prepareDataWriter();
      await dw.logout();
    } catch (e) {
      this.#logoutFailed = true;
      throw e;
    } finally {
      announceLogout('end');
    }
  };

  clearLogoutFailure = (): void => {
    this.#logoutFailed = false;
  };

  setPassword = async (opts: { password: string }): Promise<DataApiActionResult> => {
    const dw = prepareDataWriter();
    return dw.setPassword({ password: opts.password });
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
