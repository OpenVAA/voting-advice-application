import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { SupabaseDatabase } from '$lib/api/adapters/supabase/supabaseAdapter.type';

/**
 * Build `locals.safeGetSession` for one request: read the session with `getSession()`, then verify its access token with `getUser()`.
 *
 * `getSession()` runs on every call, so a session created later in the same request, as by a password login, is seen. The verification is memoised per access token for the lifetime of the returned function, so the hook's gate and the route's loader share one `getUser()` round trip. A verification that errors or throws is dropped from the memo, never reused as a success.
 *
 * Call it once per request: the memo must not outlive the request whose cookies produced the token.
 * @param supabase - This request's server client.
 * @returns The function `hooks.server.ts` attaches to `event.locals`. It resolves to `{ session: null, user: null }` when there is no session or the token does not verify.
 */
export function createSafeGetSession(
  supabase: SupabaseClient<SupabaseDatabase>
): () => Promise<{ session: Session | null; user: User | null }> {
  const verifiedUsers = new Map<string, Promise<User | null>>();

  /**
   * Verify an access token once, sharing the pending result between concurrent callers.
   * @param accessToken - The token of the session just read.
   * @returns The verified user, or `null` when verification errored.
   */
  function verify(accessToken: string): Promise<User | null> {
    const cached = verifiedUsers.get(accessToken);
    if (cached) return cached;
    const verification = supabase.auth.getUser().then(({ data: { user }, error }) => (error ? null : user));
    verifiedUsers.set(accessToken, verification);
    verification.then(
      (user) => {
        if (!user) verifiedUsers.delete(accessToken);
      },
      () => verifiedUsers.delete(accessToken)
    );
    return verification;
  }

  return async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) return { session: null, user: null };
    const user = await verify(session.access_token);
    if (!user) return { session: null, user: null };
    return { session, user };
  };
}
