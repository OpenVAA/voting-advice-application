import { json } from '@sveltejs/kit';
import { AUTH_TOKEN_KEY } from '$lib/auth';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

/**
 * An API route for logging out candidates.
 *
 * @returns A json `Response` with a `DataApiActionResult`.
 */
export async function POST({ cookies }) {
  cookies.delete(AUTH_TOKEN_KEY, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/'
  });
  return json({ ok: true, type: 'success' } as DataApiActionResult);
}
