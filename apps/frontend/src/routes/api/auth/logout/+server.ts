import { log } from '@openvaa/app-shared';
import { json } from '@sveltejs/kit';
import { withdrawLogoutDeadline } from '$lib/server/auth/logoutDeadline';
import type { RequestEvent } from '@sveltejs/kit';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

/**
 * Server-side logout endpoint for Supabase auth.
 *
 * Calls `signOut` on the server Supabase client so that httpOnly session cookies are cleared via the `setAll` callback in `createSupabaseServerClient`. Client-side `signOut` alone cannot remove httpOnly cookies.
 *
 * The scope is deliberately local: this clears the session on this device only and leaves the user's other sessions alone.
 *
 * Before the sign-out, `withdrawLogoutDeadline` expires every count of the logout modal the request carries, so that no count a closed tab left can end a session this browser signs in later; a sign-out that then fails is answered as below.
 *
 * A failed sign-out is answered with status 502 and a failure. The auth client may or may not have removed the session by then: it has when the auth service's answer is what failed, and has not when the session could not be read to begin with. So a caller must not take the user for signed out.
 *
 * @returns A json `Response` with a `DataApiActionResult`.
 */
export async function POST(event: RequestEvent): Promise<Response> {
  withdrawLogoutDeadline(event);
  const { error } = await event.locals.supabase.auth.signOut({ scope: 'local' });
  if (error) {
    log.error(`[auth/logout] sign-out failed: ${error.name}`);
    return json({ ok: false, type: 'failure' } as DataApiActionResult, { status: 502 });
  }
  return json({ ok: true, type: 'success' } as DataApiActionResult);
}
