import { log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { createDataWriter } from '$lib/api/dataWriter';
import { claimAndRefresh } from '$lib/auth/sessionAdmission';
import { COOKIE } from '$lib/cookies';
import { buildRoute, localizeAppPath, safeRedirectTarget } from '$lib/routes';
import type { AuthError, EmailOtpType } from '@supabase/supabase-js';
import type { Cookies } from '@sveltejs/kit';
import type { ContestantLoginError } from '$contestant/utils/loginError';

/**
 * The types of the links the `account-access` function mails: `magiclink` in the sign-in mail, `recovery` in the recovery mail and `email_change` in the address-confirmation mail.
 */
export const MAILED_LINK_TYPES = ['magiclink', 'recovery', 'email_change'] as const;

/**
 * A type of a link the `account-access` function mails.
 */
export type MailedLinkType = (typeof MAILED_LINK_TYPES)[number];

/**
 * Whether a value is one of {@link MAILED_LINK_TYPES}.
 * @param type - The value of a link's `type` parameter, if any.
 * @returns `true` for a type the function mails.
 */
export function isMailedLinkType(type: string | null | undefined): type is MailedLinkType {
  return (MAILED_LINK_TYPES as ReadonlyArray<string>).includes(type ?? '');
}

/**
 * The link types refused without verifying them: nothing issues one, and verifying one for an invited account stores a password nobody chose. The auth callback refuses them too, before it hands a link to the confirm page.
 */
export const REFUSED_LINK_TYPES: ReadonlySet<string> = new Set(['invite', 'signup', 'email']);

/**
 * How the auth client reports the verification of an `email_change` link whose new address another account took after the link was mailed: status 500 and no error code, because the change breaks the uniqueness of addresses in the auth service. An expired link, or one a newer link replaced, answers 403 with the code `otp_expired`; a gateway error has another status; an unreachable service has status 0. Any other server failure of the verification with status 500 and no code is read the same way.
 */
const ADDRESS_TAKEN_FAILURE = { status: 500, code: undefined } as const;

/**
 * The attributes of {@link COOKIE.registered}: out of the page's script's reach, sent on a top-level navigation from another site and on no other cross-site request, valid on every path and kept for a year.
 */
const REGISTERED_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 365
} as const;

/** The value of {@link COOKIE.registered}. Its presence is what is read; the value says nothing of an account. */
const REGISTERED_COOKIE_VALUE = '1';

/**
 * Verify the token of a mailed link, claim the user's invitations and land the user: the one place a mailed link is spent. The confirm page's action calls it when its form is posted; the auth callback, which the mails name, only hands the link to that page.
 *
 * The order is verify, claim, refresh, land. A verified token is a session. The claim turns the user's open invitations into grants, and the session is refreshed when a grant was written, because an access token lists only the grants its user held when it was issued. Only then is the landing chosen. No arm reads the session for a grant gate or asks whether the user has a password: a landing page's own load decides what the user may open, and the Contestant App's protected layout asks a user with no password to set one before it shows any page.
 *
 * The arms, by the type of the verified token:
 * - `recovery`: the password reset page.
 * - `magiclink`: the sign-in link the `account-access` function mails, to a first-time and to a returning user alike, so the type does not say which. Every user goes to the validated `next` path, or to the Contestant App's root.
 * - `email_change`: the link the `account-access` function mails to confirm the address an account the identity provider made gave. Opened, it makes that address the account's sign-in address and answers with a session, and the user goes to the Contestant App's root, as for any other type. A verification that answers no session confirmed nothing, because the auth service still waits for the account's current address, so it is a failure and claims nothing. A failure lands where it can say what happened: a browser that holds a session goes to the Contestant App's root, whose protected layout reads the account's own pending address and, when another account now holds it, asks for another; a browser with no session goes to the login page with the notice that the address is now used by another account when the verification failed as a taken address does, and with the auth error otherwise. Nothing of the failure itself reaches the landing.
 * - Any other type: the Contestant App's root.
 *
 * A verified `magiclink` link, and an `email_change` link that answered a session, leave {@link COOKIE.registered} on the browser before the claim, so that the registration page can later say that this browser has registered. A `recovery` link, a failed verification and a refused type leave nothing.
 *
 * A claim that fails is logged. On the `magiclink` arm the session is then dropped and the user is sent to the login page with the auth error, so that nobody lands in the app with grants that were not written. On every other arm the landing goes ahead.
 *
 * A link of the type `invite`, `signup` or `email` is refused before it is verified, as a link with a missing token or type is: nothing issues one, and verifying one for an invited account stores a password nobody chose, after which the account would read as having one.
 *
 * On a failed verification of any type but `email_change`, a missing token or type or a refused type, redirects to login with the auth error, and claims nothing.
 *
 * Uses `locals.supabase`, the per-request server client the request hook attaches, so session cookies are set automatically by the Supabase SSR package. A client constructed here instead would verify the token and then drop the session, because only the hook's client carries the `setAll` callback that writes the httpOnly cookies back onto the response. The claim runs on that same client, as the user the token signed in.
 *
 * Locale. Every target below is emitted through the route builder carrying the locale Paraglide resolved for the request, so a recipient who opened a mail link in a non-base locale is returned to that locale's pages.
 *
 * Every redirect names its target by route key and lets the builder assemble the URL, so a route that moves stays reachable from here without a second edit. Search-side values are passed RAW: the builder percent-encodes them, and a value encoded first would arrive encoded twice.
 *
 * `next` is caller supplied, so it is validated as a plain relative app path before anything redirects to it. A value that is not one degrades to the Contestant App's root, which is the same place an absent `next` goes.
 *
 * Tested in `mailedLink.test.ts`.
 * @param options.tokenHash - The link's `token_hash`, if any.
 * @param options.type - The link's `type`, if any.
 * @param options.next - The link's `next`, if any.
 * @param options.locals - The request's locals, carrying the hook's client, the session reader and the locale.
 * @param options.cookies - The request's cookies, on which the marker of a confirmed address is set.
 * @param options.fetch - The request's `fetch`, which the claim's data writer uses.
 * @returns Never: it always throws the redirect to the landing.
 */
export async function verifyMailedLink({
  tokenHash,
  type,
  next,
  locals,
  cookies,
  fetch
}: {
  tokenHash: string | null;
  type: string | null;
  next: string | null;
  locals: App.Locals;
  cookies: Pick<Cookies, 'set'>;
  fetch: typeof globalThis.fetch;
}): Promise<never> {
  const locale = locals.currentLocale;

  if (tokenHash && type && !REFUSED_LINK_TYPES.has(type)) {
    const otpType = type as EmailOtpType;
    const { data, error } = await locals.supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
    if (otpType === 'email_change' && (error || !data?.session))
      throw redirect(303, await emailChangeFailureRoute({ error, locals, locale }));
    if (!error) {
      if (otpType === 'magiclink' || otpType === 'email_change')
        cookies.set(COOKIE.registered, REGISTERED_COOKIE_VALUE, REGISTERED_COOKIE_OPTIONS);
      const claim = await claimAndRefresh({
        context: {
          auth: locals.supabase.auth,
          claimInvitations: () => createDataWriter({ fetch, locals }).claimInvitations()
        },
        logLabel: 'Mailed link'
      });
      switch (otpType) {
        case 'recovery':
          throw redirect(303, buildRoute({ route: 'ContestantAppResetPassword', locale }));
        case 'magiclink':
          if (!claim) {
            await locals.supabase.auth
              .signOut({ scope: 'local' })
              .catch((e: Error) =>
                log.error(`Mailed link: sign-out after a failed claim failed: ${e?.message ?? '-'}`)
              );
            throw redirect(303, buildRoute({ route: 'ContestantAppLogin', locale, errorMessage: 'authError' }));
          }
          throw redirect(303, landingRoute({ next, locale }));
        default:
          throw redirect(303, buildRoute({ route: 'ContestantAppHome', locale }));
      }
    }
  }

  // A failed verification, a missing token or type, or a refused type.
  throw redirect(303, buildRoute({ route: 'ContestantAppLogin', locale, errorMessage: 'authError' }));
}

/**
 * Where the user of a link that confirms a new address lands when the link did not change the address: the Contestant App's root for a browser that holds a session, and the login page with a notice otherwise.
 *
 * Only the browser's own session is asked for. A session that cannot be read counts as none, so the request still ends on the login page.
 * @param options.error - The verification's error, or `null` when it answered no session without one.
 * @param options.locals - The request's locals.
 * @param options.locale - The locale of the target.
 * @returns The target's URL.
 */
async function emailChangeFailureRoute({
  error,
  locals,
  locale
}: {
  error: AuthError | null;
  locals: App.Locals;
  locale: string;
}): Promise<string> {
  const { session } = await locals.safeGetSession().catch((e: Error) => {
    log.error(`Mailed link: reading the session after a failed email_change link failed: ${e?.name ?? '-'}`);
    return { session: null };
  });
  if (session) return buildRoute({ route: 'ContestantAppHome', locale });
  const errorMessage: ContestantLoginError = isAddressTakenFailure(error) ? 'emailTaken' : 'authError';
  return buildRoute({ route: 'ContestantAppLogin', locale, errorMessage });
}

/**
 * Whether a verification's error is that of an `email_change` link whose new address another account took: {@link ADDRESS_TAKEN_FAILURE}.
 * @param error - The verification's error, if any.
 * @returns `true` for that failure, `false` for any other and for none.
 */
function isAddressTakenFailure(error: AuthError | null): boolean {
  return (
    error != null &&
    error.status === ADDRESS_TAKEN_FAILURE.status &&
    (error.code ?? undefined) === ADDRESS_TAKEN_FAILURE.code
  );
}

/**
 * Where the user of a sign-in link lands: the caller-supplied `next` path when it is a plain relative app path, and the Contestant App's root otherwise.
 * @param options.next - The raw `next` value, if any.
 * @param options.locale - The locale of the target.
 * @returns The target's URL.
 */
function landingRoute({ next, locale }: { next: string | null; locale: string }): string {
  // The validator wants a path with no leading separator, and the caller may or may not have sent one.
  const target = safeRedirectTarget(next?.replace(/^\//, ''));
  return target ? localizeAppPath(`/${target}`, locale) : buildRoute({ route: 'ContestantAppHome', locale });
}
