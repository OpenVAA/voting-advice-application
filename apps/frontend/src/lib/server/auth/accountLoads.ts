import { redirect } from '@sveltejs/kit';
import { LOGOUT_DEADLINE_SETTLED } from '$lib/auth/logoutDeadline';
import { addressStateOf } from '$lib/contestant/utils/identityProviderAccount';
import { COOKIE } from '$lib/cookies';
import { buildRoute } from '$lib/routes';
import type { RequestEvent } from '@sveltejs/kit';

// The server loads the Admin App and the Contestant App share, each re-exported by both apps' route files. Tested in `accountLoads.test.ts`.

/**
 * Build the load of an app's password-reset page, which decides on the server whether the page is shown: to a signed-in user, whoever they are and however they arrived, and to nobody else.
 *
 * A request without a session, or with one the server could verify no user for, is redirected to the app's login page in the request's locale, with no parameter, so no part of the page's form reaches a visitor who cannot use it.
 *
 * The load decides by the session alone, read through `locals.safeGetSession()`. It looks at nothing of the address it was asked for: a mailed link names a type when it is opened, and whoever holds the link can change that name, so it says nothing about what was asked for.
 *
 * It returns the address of the verified user under `email`, which the page shows and hands to its form, and nothing else. An account an identity provider made that holds only its placeholder address has no address of its own yet, so it gets none: the placeholder is never shown or handed to a password manager. No part of the session is returned: everything a server load returns is written into the page's markup.
 *
 * @param loginRoute - The login page of the app the password-reset page belongs to.
 * @returns The page's `load`.
 */
export function passwordResetLoad(loginRoute: 'AdminAppLogin' | 'ContestantAppLogin') {
  return async function load({ locals }: Pick<RequestEvent, 'locals'>) {
    const { session, user } = await locals.safeGetSession();
    if (!session || !user) redirect(303, buildRoute({ route: loginRoute, locale: locals.currentLocale }));
    const proved =
      addressStateOf({
        email: user.email,
        newEmail: user.new_email,
        identityProvider: user.app_metadata?.identity_provider
      }) === 'proved';
    return { email: proved ? user.email : undefined };
  };
}

/**
 * The load of an app's login page, which serves two purposes.
 *
 * - A client-side navigation to the page sends a request the request hook sees, which sends a caller with a session to the app's home; see `appGates.ts`.
 * - It answers why the visitor was sent here when the request hook has just ended the session at the end of a logout count. The hook writes {@link LOGOUT_DEADLINE_SETTLED} into `COOKIE.logoutPending` in the response that signs out, the gate sends the request to the login page, and the browser's request for the page carries the value; the root layout removes it only after the page has loaded. The page shows this reason before any the address bar names, which says less. The load reads that one cookie and no session.
 *
 * @param event - The request's cookies.
 * @returns `{ signedOutReason: 'loggedOutAutomatically' }` when the request carries the settled value, and an empty object otherwise.
 */
export function signedOutReasonLoad({ cookies }: Pick<RequestEvent, 'cookies'>): {
  signedOutReason?: 'loggedOutAutomatically';
} {
  return cookies.get(COOKIE.logoutPending) === LOGOUT_DEADLINE_SETTLED
    ? { signedOutReason: 'loggedOutAutomatically' }
    : {};
}

/**
 * # An app's outermost server load — the request's session, as a PROJECTION
 *
 * Provides the app's `page.data.session` to `authContext`'s `isAuthenticated` derived flag and to `getUserData`'s ancestor pre-check, both of which need EXISTENCE only. The outer layouts of the Admin App and the Contestant App both re-export it.
 *
 * ## ⚠ Why this returns a PROJECTION and never the session
 *
 * This load returns `{ userId, expiresAt }` and not `locals.safeGetSession()`'s whole `Session` — `access_token`, **`refresh_token`**, `expires_at` and the full `user` record. Everything a server load returns is serialised into the hydration payload in the HTML body, so the session would put a REFRESH TOKEN into the document of every page of the app, for every signed-in user. The refresh token is the higher-value credential of the pair: it is long-lived, and a document body exposes it to HTML/page caches, to `view-source` sharing, and to DOM-snapshot error reporters.
 *
 * The reason is written out HERE, in full, rather than referenced: a reader arriving at this function must find it without following a link. The root layout, `routes/+layout.server.ts`, follows the same rule and returns no session at all.
 *
 * `{ userId, expiresAt }` is therefore the whole vocabulary. Adding a member to it — the access token, the refresh token, the user record — is not a widening of a payload, it is a re-disclosure of a credential. `accountLoads.test.ts` enumerates the returned key set and fails such a member BY NAME, and `scripts/assert-no-session-in-loads.mjs` fails the lint chain if any server load returns the verified-session binding itself.
 *
 * ## Why the identifier comes from the VERIFIED user
 *
 * `locals.safeGetSession()` returns two things: the session, and a user it verified separately with `getUser()`. The session's OWN nested user is wrapped in an insecure-use proxy by the auth library precisely because it is unverified. The verified one is already in scope in the same destructuring, so preferring it costs nothing and removes a warning-shaped footgun.
 *
 * @param event - The request's locals.
 * @returns `{ session }`: the projection, or `null` without a session or a verified user.
 */
export async function sessionProjectionLoad({ locals }: Pick<RequestEvent, 'locals'>) {
  const { session, user } = await locals.safeGetSession();

  // The projection, built per request and held nowhere: one request's identifier cannot reach another request's payload. `expires_at` is carried through as the value the session reported — never re-derived from a clock, never rounded, never converted between units — or the null form when the session reports none.
  return {
    session: session && user ? { userId: user.id, expiresAt: session.expires_at ?? null } : null
  };
}
