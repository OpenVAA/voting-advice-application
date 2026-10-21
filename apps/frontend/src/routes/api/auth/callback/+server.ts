import { log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { createDataWriter } from '$lib/api/dataWriter';
import { claimAndRefresh } from '$lib/auth/sessionAdmission';
import { buildRoute, localizeAppPath, safeRedirectTarget } from '$lib/routes';
import type { EmailOtpType } from '@supabase/supabase-js';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * The link types the callback refuses without verifying them.
 */
const REFUSED_TYPES: ReadonlySet<string> = new Set(['invite', 'signup', 'email']);

/**
 * Auth callback route: verifies the token of a mailed link, claims the user's invitations and lands the user.
 *
 * The order is verify, claim, refresh, land. A verified token is a session. The claim turns the user's open invitations into grants, and the session is refreshed when a grant was written, because an access token lists only the grants its user held when it was issued. Only then is the landing chosen. No arm reads the session for a grant gate or asks whether the user has a password: a landing page's own load decides what the user may open, and the Contestant App's protected layout asks a user with no password to set one before it shows any page.
 *
 * The arms, by the type of the verified token:
 * - `recovery`: the password reset page.
 * - `magiclink`: the sign-in link the `account-access` function mails, to a first-time and to a returning user alike, so the type does not say which. Every user goes to the validated `next` path, or to the Contestant App's root.
 * - Any other type: the Contestant App's root.
 *
 * A claim that fails is logged. On the `magiclink` arm the session is then dropped and the user is sent to the login page with the auth error, so that nobody lands in the app with grants that were not written. On every other arm the landing goes ahead.
 *
 * A link of the type `invite`, `signup` or `email` is refused before it is verified, as a request with missing params is: nothing issues one, and verifying one for an invited account stores a password nobody chose, after which the account would read as having one.
 *
 * On a failed verification, missing params or a refused type, redirects to login with an error message, and claims nothing.
 *
 * Uses `locals.supabase`, the per-request server client the request hook attaches, so session cookies are set automatically by the Supabase SSR package. A client constructed here instead would verify the token and then drop the session, because only the hook's client carries the `setAll` callback that writes the httpOnly cookies back onto the response. The claim runs on that same client, as the user the token signed in.
 *
 * Locale. Every target below is emitted through the route builder carrying the locale Paraglide resolved for THIS request, so a recipient who opened a mail link in a non-base locale is returned to that locale's pages. The link carries its locale because the address that produced it is built the same way, and the auth service's redirect allowlist admits exactly one locale segment in front of this path. The locale therefore survives the round trip instead of degrading to the base locale.
 *
 * Every redirect names its target by route key and lets the builder assemble the URL, so a route that moves stays reachable from here without a second edit. Search-side values are passed RAW: the builder percent-encodes them, and a value encoded first would arrive encoded twice.
 *
 * `next` is caller supplied and arrives on the query string, so it is validated as a plain relative app path before anything redirects to it. A value that is not one degrades to the Contestant App's root, which is the same place an absent `next` goes.
 */
export async function GET({ url, locals, fetch }: RequestEvent): Promise<never> {
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = url.searchParams.get('next');
  const locale = locals.currentLocale;

  if (token_hash && type && !REFUSED_TYPES.has(type)) {
    const { error } = await locals.supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      const claim = await claimAndRefresh({
        context: {
          auth: locals.supabase.auth,
          claimInvitations: () => createDataWriter({ fetch, locals }).claimInvitations()
        },
        logLabel: 'Auth callback'
      });
      switch (type) {
        case 'recovery':
          throw redirect(303, buildRoute({ route: 'ContestantAppResetPassword', locale }));
        case 'magiclink':
          if (!claim) {
            await locals.supabase.auth
              .signOut({ scope: 'local' })
              .catch((e: Error) =>
                log.error(`Auth callback: sign-out after a failed claim failed: ${e?.message ?? '-'}`)
              );
            throw redirect(303, buildRoute({ route: 'ContestantAppLogin', locale, errorMessage: 'authError' }));
          }
          throw redirect(303, landingRoute({ next, locale }));
        default:
          throw redirect(303, buildRoute({ route: 'ContestantAppHome', locale }));
      }
    }
  }

  // Error, missing params or a refused type: redirect to login with an error
  throw redirect(303, buildRoute({ route: 'ContestantAppLogin', locale, errorMessage: 'authError' }));
}

/**
 * Where the user of a sign-in link lands: the caller-supplied `next` path when it is a plain relative app path, and the Contestant App's root otherwise.
 * @param options.next - The raw `next` value of the query string, if any.
 * @param options.locale - The locale of the target.
 * @returns The target's URL.
 */
function landingRoute({ next, locale }: { next: string | null; locale: string }): string {
  // The validator wants a path with no leading separator, and the caller may or may not have sent one.
  const target = safeRedirectTarget(next?.replace(/^\//, ''));
  return target ? localizeAppPath(`/${target}`, locale) : buildRoute({ route: 'ContestantAppHome', locale });
}
