import { json } from '@sveltejs/kit';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

/**
 * An API route for logging out candidates.
 */
export async function POST({ cookies }) {
  console.error('[Candidate App logout] Candidate logged out');

  cookies.delete('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/'
  });

  return json({ ok: true, type: 'success' } as DataApiActionResult);
}
