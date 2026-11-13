import { log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { createDataWriter } from '$lib/api/dataWriter';
import { isContestantOnly } from '$lib/auth/homeApp';
import { claimAndRefresh } from '$lib/auth/sessionAdmission';
import { COOKIE } from '$lib/cookies';
import { buildRoute } from '$lib/routes';
import { withdrawLogoutCount } from '$lib/server/auth/logoutCount';
import type { AuthError, EmailOtpType } from '@supabase/supabase-js';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import type { ContestantLoginError } from '$contestant/utils/loginError';
import type { DataWriter } from '$lib/api/base/dataWriter.type';
import type { Route } from '$lib/routes';

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
 * Where a mailed link the request of one app earned lands: that app's page for each outcome of the link.
 */
export type MailedLinkLanding = {
  /** Where a verified sign-in link lands. */
  readonly home: Route;
  /** Where a verified recovery link lands. */
  readonly resetPassword: Route;
  /** Where a link that is refused, fails to verify or whose claim fails lands, with the auth error. */
  readonly login: Route;
};

/** The landing of a link that names no app the table holds: the Contestant App's. */
const CONTESTANT_APP_LANDING: MailedLinkLanding = Object.freeze({
  home: 'ContestantAppHome',
  resetPassword: 'ContestantAppResetPassword',
  login: 'ContestantAppLogin'
});

/**
 * The landing of each app other than the Contestant App, keyed by the exact `next` the `account-access` function writes into a link a request made in that app earns (its `APP_NEXT`).
 */
export const MAILED_LINK_LANDINGS: Readonly<Record<string, MailedLinkLanding>> = Object.freeze({
  '/admin': Object.freeze({ home: 'AdminAppHome', resetPassword: 'AdminAppResetPassword', login: 'AdminAppLogin' })
});

/**
 * The landing a link's `next` names: the entry of {@link MAILED_LINK_LANDINGS} whose key is exactly the value, and the Contestant App's for any other value and for none.
 *
 * The value is looked up as an own key of the table and never used as a path, so no `next` can lead anywhere the table does not name, and a key of the object prototype, such as `constructor`, names the Contestant App's.
 * @param next - The link's `next`, if any.
 * @returns The landing.
 */
export function mailedLinkLanding(next: string | null | undefined): MailedLinkLanding {
  return next != null && Object.hasOwn(MAILED_LINK_LANDINGS, next)
    ? MAILED_LINK_LANDINGS[next]
    : CONTESTANT_APP_LANDING;
}

/**
 * The link types the auth callback refuses before it hands a link to the confirm page: nothing issues one, and verifying one for an invited account stores a password nobody chose. `verifyMailedLink` refuses them too, as it refuses every type that is not one of {@link MAILED_LINK_TYPES}.
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
 * Verify the token of a mailed link, claim the user's invitations and land the user: the one place a mailed link is spent. The confirm page, which the mails name, is its one caller, from its action when its form is posted; the auth callback only hands a link that names it to that page.
 *
 * The order is verify, claim, refresh, land. A verified token is a session. The claim turns the user's open invitations into grants, and the session is refreshed when a grant was written, because an access token lists only the grants its user held when it was issued. Only then is the landing chosen. No arm gates on the grants or asks whether the user has a password: a landing page's own load decides what the user may open, and the Contestant App's protected layout asks a user with no password to set one before it shows any page. The grants choose only between the two apps' landings, as the arms below say.
 *
 * The arms, by the type of the verified token:
 * - `recovery`: the password reset page of the app the link's `next` names, through {@link mailedLinkLanding}: the Admin App's for `/admin`, and the Contestant App's for any other value and for none.
 * - `magiclink`: the sign-in link the `account-access` function mails, to a first-time and to a returning user alike, so the type does not say which. Every user goes to the home of the app the link's `next` names, through {@link mailedLinkLanding}: the Admin App's for `/admin`, and the Contestant App's root for any other value and for none.
 * - On both arms, a link that names the Admin App lands a user whose grants in this project, read after the claim, open the Contestant App and not the Admin App on the Contestant App's page instead, so that the link is not spent on an app that would sign the user out.
 * - `email_change`: the link the `account-access` function mails to confirm the address an account the identity provider made gave. Opened, it makes that address the account's sign-in address and answers with a session, and the user goes to the Contestant App's root, as for any other type. A verification that answers no session confirmed nothing, because the auth service still waits for the account's current address, so it is a failure and claims nothing. A failure lands where it can say what happened: a browser that holds a session goes to the Contestant App's root, whose protected layout reads the account's own pending address and, when another account now holds it, asks for another; a browser with no session goes to the login page with the notice that the address is now used by another account when the verification failed as a taken address does, and with the auth error otherwise. Nothing of the failure itself reaches the landing.
 *
 * A verification that answers no error and a session withdraws every count of the logout modal the request carries, through `withdrawLogoutCount`, right after `verifyOtp` and before anything else, so that no count a closed tab left can end the session the link has just signed in. Only then is the session known to be set, so every other path keeps both cookies: a missing or refused type, a failed verification and an `email_change` link that answered no session. A session the request held before is the caller's to end first, and a count it keeps is the request hook's to act on.
 *
 * A verified `magiclink` link, and an `email_change` link that answered a session, leave {@link COOKIE.registered} on the browser before the claim, so that the registration page can later say that this browser has registered. A `recovery` link, a failed verification and a refused type leave nothing.
 *
 * A claim that fails is logged. On the `magiclink` arm the session is then dropped and the user is sent to the login page of the app the link's `next` names, with the auth error, so that nobody lands in the app with grants that were not written. On every other arm the landing goes ahead.
 *
 * Only the {@link MAILED_LINK_TYPES} are verified. A link of any other type is refused before it is verified, as a link with a missing token or type is. Among them are `invite`, `signup` and `email`: nothing issues one, and verifying one for an invited account stores a password nobody chose, after which the account would read as having one.
 *
 * On a failed verification of any type but `email_change`, a missing token or type or a refused type, redirects to the login page of the app the link's `next` names, with the auth error, and claims nothing. The `email_change` link is the Contestant App's alone, so its failures land there whatever `next` says.
 *
 * Uses `locals.supabase`, the per-request server client the request hook attaches, so session cookies are set automatically by the Supabase SSR package. A client constructed here instead would verify the token and then drop the session, because only the hook's client carries the `setAll` callback that writes the httpOnly cookies back onto the response. The claim runs on that same client, as the user the token signed in.
 *
 * Locale. Every target below is emitted through the route builder carrying the locale Paraglide resolved for the request, so a recipient who opened a mail link in a non-base locale is returned to that locale's pages.
 *
 * Every redirect names its target by route key and lets the builder assemble the URL, so a route that moves stays reachable from here without a second edit. Search-side values are passed RAW: the builder percent-encodes them, and a value encoded first would arrive encoded twice.
 *
 * `next` is caller supplied, so it is never used as a path: it is looked up in {@link MAILED_LINK_LANDINGS}, whose keys are the exact values the `account-access` function writes, and only the route key of the entry it names reaches the route builder. Any other value lands where an absent `next` does.
 *
 * Tested in `mailedLink.test.ts`.
 * @param options.tokenHash - The link's `token_hash`, if any.
 * @param options.type - The link's `type`, if any.
 * @param options.next - The link's `next`, if any.
 * @param options.locals - The request's locals, carrying the hook's client, the session reader and the locale.
 * @param options.cookies - The request's cookies, on which the marker of a confirmed address is set and from which the logout count is withdrawn.
 * @param options.fetch - The request's `fetch`, which the claim's data writer uses.
 * @param options.request - The request, whose `Cookie` header says which counts it carries.
 * @param options.url - The request's address, whose host and protocol the removal of the counts is written for.
 * @returns Never: it always throws the redirect to the landing.
 */
export async function verifyMailedLink({
  tokenHash,
  type,
  next,
  locals,
  cookies,
  fetch,
  request,
  url
}: {
  tokenHash: string | null;
  type: string | null;
  next: string | null;
  locals: App.Locals;
  cookies: Cookies;
  fetch: typeof globalThis.fetch;
  request: RequestEvent['request'];
  url: RequestEvent['url'];
}): Promise<never> {
  const locale = locals.currentLocale;
  const landing = mailedLinkLanding(next);

  if (tokenHash && isMailedLinkType(type)) {
    const otpType: EmailOtpType = type;
    const { data, error } = await locals.supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
    if (!error && data?.session) withdrawLogoutCount({ cookies, request, url });
    if (otpType === 'email_change' && (error || !data?.session))
      throw redirect(303, await emailChangeFailureRoute({ error, locals, locale }));
    if (!error) {
      if (otpType === 'magiclink' || otpType === 'email_change')
        cookies.set(COOKIE.registered, REGISTERED_COOKIE_VALUE, REGISTERED_COOKIE_OPTIONS);
      const dataWriter = createDataWriter({ fetch, locals });
      const claim = await claimAndRefresh({
        context: {
          auth: locals.supabase.auth,
          claimInvitations: () => dataWriter.claimInvitations()
        },
        logLabel: 'Mailed link'
      });
      switch (otpType) {
        case 'recovery':
          throw redirect(
            303,
            buildRoute({ route: (await landingForGrants(landing, dataWriter)).resetPassword, locale })
          );
        case 'magiclink':
          if (!claim) {
            await locals.supabase.auth
              .signOut({ scope: 'local' })
              .catch((e: Error) =>
                log.error(`Mailed link: sign-out after a failed claim failed: ${e?.message ?? '-'}`)
              );
            throw redirect(303, buildRoute({ route: landing.login, locale, errorMessage: 'authError' }));
          }
          throw redirect(303, buildRoute({ route: (await landingForGrants(landing, dataWriter)).home, locale }));
        default:
          throw redirect(303, buildRoute({ route: 'ContestantAppHome', locale }));
      }
    }
  }

  // A failed verification, a missing token or type, or a refused type.
  throw redirect(303, buildRoute({ route: landing.login, locale, errorMessage: 'authError' }));
}

/**
 * The landing of a verified link once the user's grants are known: the Contestant App's in place of another app's for a user whose grants in this project open the Contestant App and not that app, as `isContestantOnly` reads them, so that such a user is not signed out by an app that does not admit them. Any other user, a user with no grant that opens either app among them, keeps the landing `next` named, and so does every user when the grants cannot be read, which is logged.
 * @param landing - The landing the link's `next` names.
 * @param dataWriter - The request's writer, whose `getProjectGrants` reads the grants that reach this project.
 * @returns The landing.
 */
async function landingForGrants(
  landing: MailedLinkLanding,
  dataWriter: Pick<DataWriter, 'getProjectGrants'>
): Promise<MailedLinkLanding> {
  if (landing === CONTESTANT_APP_LANDING) return landing;
  const grants = await dataWriter.getProjectGrants().catch((e: Error | undefined) => {
    log.error(`Mailed link: reading the grants that reach this project failed: ${e?.message ?? '-'}`);
    return undefined;
  });
  return grants !== undefined && isContestantOnly(grants) ? CONTESTANT_APP_LANDING : landing;
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
