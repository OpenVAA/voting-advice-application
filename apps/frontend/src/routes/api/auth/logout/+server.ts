import { json } from '@sveltejs/kit';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

/**
 * An API route for logging out candidates.
 *
 * @returns A json `Response` with a `DataApiActionResult`.
 */
export async function POST({ locals }) {
  await locals.supabase.auth.signOut();
  return json({ ok: true, type: 'success' } as DataApiActionResult);
}
