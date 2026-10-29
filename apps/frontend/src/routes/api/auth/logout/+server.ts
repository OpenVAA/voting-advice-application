import { log } from '@openvaa/app-shared';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

/**
 * Server-side logout endpoint for Supabase auth.
 *
 * Calls `signOut` on the server Supabase client so that httpOnly session cookies are cleared via the `setAll` callback in `createSupabaseServerClient`. Client-side `signOut` alone cannot remove httpOnly cookies.
 *
 * The scope is deliberately local: this clears the session on this device only and leaves the user's other sessions alone.
 *
 * A failed sign-out is answered with status 502 and a failure: the auth client then removes no session, so the cookies may still hold one, and a caller must not take the user for signed out.
 *
 * @returns A json `Response` with a `DataApiActionResult`.
 */
export async function POST({ locals }: RequestEvent): Promise<Response> {
  const { error } = await locals.supabase.auth.signOut({ scope: 'local' });
  if (error) {
    log.error(`[auth/logout] sign-out failed: ${error.name}`);
    return json({ ok: false, type: 'failure' } as DataApiActionResult, { status: 502 });
  }
  return json({ ok: true, type: 'success' } as DataApiActionResult);
}
