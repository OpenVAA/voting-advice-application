import { log } from '@openvaa/app-shared';
import { error, json } from '@sveltejs/kit';
import { COOKIE } from '$lib/cookies';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function POST({ cookies, request: _request, locals }) {
  const idToken = cookies.get(COOKIE.idToken);

  if (!idToken) {
    error(401, { message: 'ID token has expired.' });
  }

  // Call identity-callback Edge Function with the raw id_token. The Edge Function handles JWE decryption, JWT verification, user/candidate creation, and returns a magic link for session establishment.
  try {
    const { data, error: fnError } = await locals.supabase.functions.invoke('identity-callback', {
      body: { id_token: idToken }
    });

    if (fnError) {
      // PRESERVE THE FUNCTION'S OWN STATUS. `functions.invoke` collapses every failure into a `FunctionsHttpError` whose `message` is the fixed string 'Edge Function returned a non-2xx status code' -- it says nothing about WHICH non-2xx. Hardcoding 500 here threw away the one non-leaky signal the function does emit, and the two statuses mean opposite things to whoever is debugging: a 401 means the TOKEN was rejected (decryption, signature or claims) and re-authenticating may fix it, while a 5xx means the DEPLOYMENT is misconfigured (ERR_ENV_UNCONFIGURED, unknown provider type) or an admin API call failed, no amount of retrying helps, and the variable name is in the function's container log and nowhere else.
      //
      // Without that distinction a 500 and a 401 arrive at the browser identically, which is what sent an operator hunting through the whole token pipeline for what was an unset IDENTITY_PROVIDER_TYPE (`.planning/debug/idura-bank-auth-empty-client.md`).
      //
      // `context` is the upstream `Response` and is present on `FunctionsHttpError` but NOT on `FunctionsRelayError` / `FunctionsFetchError` (the function was never reached), so an absent or out-of-range status falls back to 502: "the upstream did not answer usefully" is nearer the truth than "this route failed internally", and `error()` would throw on a non-4xx/5xx status anyway.
      const upstreamStatus = (fnError as { context?: { status?: unknown } }).context?.status;
      const status =
        typeof upstreamStatus === 'number' && upstreamStatus >= 400 && upstreamStatus <= 599 ? upstreamStatus : 502;

      // Nothing new is disclosed by forwarding this. The function's own bodies are already opaque by design -- a fixed 'Internal server error' literal on the 500 path, precisely so an unauthenticated caller learns nothing about which variables are unset -- and the status code is a fact the caller can observe anyway by reading the response. The hint is CHOSEN BY STATUS CLASS rather than appended unconditionally. The first version of this line always said "a 5xx here is a deployment problem", which then printed verbatim under an upstream 401 and advised chasing unset variables for what was a rejected token -- a log line that misdirects is worse than the generic one it replaced.
      const hint =
        status >= 500
          ? 'This is a DEPLOYMENT problem, not a bad token: the function names the unset variable only in its own log -- read the edge runtime container, and see apps/supabase/supabase/functions/.env.example for what it requires (`yarn assert:edge-function-env <that file>` checks it).'
          : 'The TOKEN was rejected -- decryption, signature or a claim. The function logs code/claim/reason (never the payload) in its own log. A claim=aud failure usually means IDENTITY_PROVIDER_CLIENT_ID in the FUNCTION env disagrees with PUBLIC_IDENTITY_PROVIDER_CLIENT_ID in the root env; `yarn check:env-local` compares them by name.';
      log.error(
        `identity-callback Edge Function error: ${fnError.message} (upstream status ${
          typeof upstreamStatus === 'number' ? upstreamStatus : 'unavailable'
        }). ${hint}`
      );
      error(status, { message: `identity-callback returned ${status}: ${fnError.message}` });
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
          log.error(`Session establishment failed: ${verifyError.message}`);
          error(500, { message: 'Session establishment failed' });
        }
      }
    }

    // Clear the id_token cookie -- no longer needed after session establishment
    cookies.delete(COOKIE.idToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });

    return json({ type: 'success' });
  } catch (e) {
    // Re-throw SvelteKit HttpError (from error() calls above)
    if (e && typeof e === 'object' && 'status' in e) throw e;
    log.error(`Error in Supabase preregister: ${e?.toString()}`);
    error(500, { message: 'Internal server error' });
  }
}
