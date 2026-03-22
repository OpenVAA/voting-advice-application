/**
 * Server-side logout endpoint for Supabase auth.
 *
 * Calls `signOut` on the server Supabase client so that httpOnly session
 * cookies are cleared via the `setAll` callback in `createSupabaseServerClient`.
 * Client-side `signOut` alone cannot remove httpOnly cookies.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
  await locals.supabase.auth.signOut({ scope: 'local' });
  return json({ success: true });
};
