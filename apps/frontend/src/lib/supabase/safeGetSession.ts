import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { SupabaseDatabase } from '$lib/api/adapters/supabase/supabaseAdapter.type';

/**
 * How many sessions one call reads before giving up. A refresh gives the new token a full lifetime, so a second replacement within one call means storage is changing underneath it.
 */
const MAX_ATTEMPTS = 2;

/**
 * The result of a verification whose `getUser()` checked a different token than the one it was keyed on.
 */
const REPLACED: unique symbol = Symbol('replaced');

/**
 * What `createSafeGetSession` builds for one request.
 */
export type SafeGetSessionHandle = {
  /** The function `hooks.server.ts` attaches to `event.locals`. It resolves to `{ session: null, user: null }` when there is no session or the token does not verify. */
  safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
  /** Drop the memo once the response is resolved. Later calls verify afresh every time. */
  endRequest: () => void;
};

/**
 * Build `locals.safeGetSession` for one request: read the session with `getSession()`, then verify its access token with `getUser()`.
 *
 * `getSession()` runs on every call, so a session created later in the same request, as by a password login, is seen. The verification is memoised per access token until `endRequest` is called, so the hook's gate and the route's loader share one `getUser()` round trip. A verification that errors or throws is dropped from the memo, never reused as a success.
 *
 * `getUser()` takes no token, so auth-js holds its storage lock, stops warning about the session's unverified user and removes a revoked session. Called that way it verifies the token storage holds at that moment, and refreshes a token inside the expiry margin first. So the session is read again after the verification, and a user is paired only with a token storage held both before and after it. When a refresh replaced the token, the call verifies the new session instead.
 *
 * Build it once per request and call `endRequest` once the response is resolved: the memo must not outlive the request whose cookies produced the token. A caller that holds `locals` past the response, such as an admin job, then gets a fresh verification.
 * @param supabase - This request's server client.
 * @returns The request's `safeGetSession` and the `endRequest` that drops its memo.
 */
export function createSafeGetSession(supabase: SupabaseClient<SupabaseDatabase>): SafeGetSessionHandle {
  const verifiedUsers = new Map<string, Promise<User | null | typeof REPLACED>>();
  let ended = false;

  /**
   * Verify the token storage holds, and confirm it is still `accessToken` afterwards.
   * @param accessToken - The token of the session just read.
   * @returns The verified user, `null` when verification errored, or `REPLACED` when the token in storage changed.
   */
  async function verifyStored(accessToken: string): Promise<User | null | typeof REPLACED> {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    const {
      data: { session }
    } = await supabase.auth.getSession();
    return session?.access_token === accessToken ? user : REPLACED;
  }

  /**
   * Verify an access token once, sharing the pending result between concurrent callers.
   * @param accessToken - The token of the session just read.
   * @returns The verified user, `null` when verification errored, or `REPLACED` when the token in storage changed.
   */
  function verify(accessToken: string): Promise<User | null | typeof REPLACED> {
    const cached = verifiedUsers.get(accessToken);
    if (cached) return cached;
    const verification = verifyStored(accessToken);
    if (ended) return verification;
    verifiedUsers.set(accessToken, verification);
    verification.then(
      (user) => {
        if (!user || user === REPLACED) verifiedUsers.delete(accessToken);
      },
      () => verifiedUsers.delete(accessToken)
    );
    return verification;
  }

  /**
   * Read the session and verify it, starting over once when a refresh replaced its token.
   * @returns The session and its verified user, or nulls.
   */
  async function safeGetSession(): Promise<{ session: Session | null; user: User | null }> {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) return { session: null, user: null };
      const user = await verify(session.access_token);
      if (user === REPLACED) continue;
      if (!user) return { session: null, user: null };
      return { session, user };
    }
    return { session: null, user: null };
  }

  /**
   * Drop the memo and stop memoising.
   */
  function endRequest(): void {
    ended = true;
    verifiedUsers.clear();
  }

  return { safeGetSession, endRequest };
}
