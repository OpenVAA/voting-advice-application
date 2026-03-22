import { error, json } from '@sveltejs/kit';
import { logDebugError } from '$lib/utils/logger';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function POST({ cookies, request, locals }) {
  const idToken = cookies.get('id_token');

  if (!idToken) {
    error(401, { message: 'ID token has expired.' });
  }

  // Call signicat-callback Edge Function with the raw id_token.
  // The Edge Function handles JWE decryption, JWT verification, user/candidate
  // creation, and returns a magic link for session establishment.
  try {
    const { data, error: fnError } = await locals.supabase.functions.invoke('signicat-callback', {
      body: { id_token: idToken }
    });

    if (fnError) {
      logDebugError(`signicat-callback Edge Function error: ${fnError.message}`);
      error(500, { message: fnError.message });
    }

    // Establish Supabase auth session from the magic link
    if (data?.session?.action_link) {
      const actionUrl = new URL(data.session.action_link);
      const tokenHash = actionUrl.searchParams.get('token');
      const type = (actionUrl.searchParams.get('type') ?? 'magiclink') as EmailOtpType;

      if (tokenHash) {
        const { error: verifyError } = await locals.supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type
        });
        if (verifyError) {
          logDebugError(`Session establishment failed: ${verifyError.message}`);
          error(500, { message: 'Session establishment failed' });
        }
      }
    }

    // Clear the id_token cookie -- no longer needed after session establishment
    cookies.delete('id_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });

    return json({ type: 'success' });
  } catch (e) {
    // Re-throw SvelteKit HttpError (from error() calls above)
    if (e && typeof e === 'object' && 'status' in e) throw e;
    logDebugError(`Error in Supabase preregister: ${e?.toString()}`);
    error(500, { message: 'Internal server error' });
  }
}
