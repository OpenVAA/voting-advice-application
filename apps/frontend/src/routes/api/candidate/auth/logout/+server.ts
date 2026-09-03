import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Server-side logout endpoint for Supabase auth.
 *
 * Calls `signOut` on the server Supabase client so that httpOnly session cookies are cleared via the `setAll` callback in `createSupabaseServerClient`. Client-side `signOut` alone cannot remove httpOnly cookies.
 *
 * The scope is deliberately local: this clears the session on this device only and leaves the user's other sessions alone.
 *
 * @returns A json `Response` reporting success.
 */
export async function POST({ locals }: RequestEvent): Promise<Response> {
  await locals.supabase.auth.signOut({ scope: 'local' });
  return json({ success: true });
}
