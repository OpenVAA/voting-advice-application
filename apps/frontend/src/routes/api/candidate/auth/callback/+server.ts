import { redirect } from '@sveltejs/kit';
import { buildRoute, localizeAppPath, safeRedirectTarget } from '$lib/routes';
import type { EmailOtpType } from '@supabase/supabase-js';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Auth callback route for Supabase PKCE token exchange.
 *
 * Handles all Supabase auth redirects:
 * - `recovery`: Password reset flow -> redirects to the password reset page
 * - `invite`: Candidate invite flow -> redirects to the register password page
 * - `email`/`signup`: Email confirmation -> redirects to the validated `next` path or the candidate home
 * - Default: Redirects to the candidate home
 *
 * On error or missing params, redirects to login with an error message.
 *
 * Uses `locals.supabase`, the per-request server client the request hook attaches, so session cookies are set automatically by the Supabase SSR package. A client constructed here instead would verify the token and then drop the session, because only the hook's client carries the `setAll` callback that writes the httpOnly cookies back onto the response.
 *
 * Locale. Every target below is emitted through the route builder carrying the locale Paraglide resolved for THIS request, so a recipient who opened a mail link in a non-base locale is returned to that locale's pages. The link carries its locale because the address that produced it is built the same way, and the auth service's redirect allowlist admits exactly one locale segment in front of this path. The locale therefore survives the round trip instead of degrading to the base locale.
 *
 * Every redirect names its target by route key and lets the builder assemble the URL, so a route that moves stays reachable from here without a second edit. Search-side values are passed RAW: the builder percent-encodes them, and a value encoded first would arrive encoded twice.
 *
 * `next` is caller supplied and arrives on the query string, so it is validated as a plain relative app path before anything redirects to it. A value that is not one degrades to the candidate home, which is the same place an absent `next` goes.
 */
export async function GET({ url, locals }: RequestEvent): Promise<never> {
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = url.searchParams.get('next');
  const locale = locals.currentLocale;

  if (token_hash && type) {
    const { error } = await locals.supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      switch (type) {
        case 'recovery':
          throw redirect(303, buildRoute({ route: 'CandAppResetPassword', locale }));
        case 'invite': {
          // Get the user's email from the newly established session
          const {
            data: { user }
          } = await locals.supabase.auth.getUser();
          throw redirect(303, buildRoute({ route: 'CandAppSetPassword', locale, email: user?.email ?? '' }));
        }
        case 'email':
        case 'signup': {
          // The validator wants a path with no leading separator, and the caller may or may not have sent one.
          const target = safeRedirectTarget(next?.replace(/^\//, ''));
          throw redirect(
            303,
            target ? localizeAppPath(`/${target}`, locale) : buildRoute({ route: 'CandAppHome', locale })
          );
        }
        default:
          throw redirect(303, buildRoute({ route: 'CandAppHome', locale }));
      }
    }
  }

  // Error or missing params: redirect to login with an error
  throw redirect(303, buildRoute({ route: 'CandAppLogin', locale, errorMessage: 'authError' }));
}
