import type { SupabaseClient } from '@supabase/supabase-js';

/** A client of which only the read of the stored session is used. */
export type SessionReader = { auth: Pick<SupabaseClient['auth'], 'getSession'> };

/**
 * Tell whether a client holds no session any more, as read after a failure.
 *
 * A client holds no session when `auth.getSession()` answers no session and no error. A failed sign-out usually leaves it so: when the call to the auth service fails, the auth client removes the session before it answers `{ error }`, and on the server the removal of the cookies is written to the response. An error, a rejection or a session each mean that a session may be left, so they answer `false`: a caller that redirects to the login page on `true` cannot send a live session there, where the gate would send it straight back.
 *
 * @param client - The client the failure happened on: on the server the request's own, in the browser the tab's.
 * @returns `true` when the client answers no session and no error, and `false` otherwise.
 */
export async function isSessionGone(client: SessionReader): Promise<boolean> {
  try {
    const { data, error } = await client.auth.getSession();
    return !error && !data.session;
  } catch {
    return false;
  }
}
