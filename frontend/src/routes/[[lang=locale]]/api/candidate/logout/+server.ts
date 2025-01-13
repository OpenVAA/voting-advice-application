import { json } from '@sveltejs/kit';

/**
 * An API route for logging out candidates.
 */
export async function POST({ cookies }) {
  cookies.delete('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/'
  });

  return json({ ok: true });
}
