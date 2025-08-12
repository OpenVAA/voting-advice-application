import { json } from '@sveltejs/kit';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

/**
 * An API route for logging out candidates.
 *
 * @returns A json `Response` with a `DataApiActionResult`.
 */
export async function POST({ cookies }) {
  cookies.delete('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/'
  });
  return json({ ok: true, type: 'success' } as DataApiActionResult);
}
