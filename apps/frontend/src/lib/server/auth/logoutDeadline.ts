import { cookieValues, LOGOUT_DEADLINE_SETTLED, logoutDeadlineState, removalDomainsOf } from '$lib/auth/logoutDeadline';
import { COOKIE } from '$lib/cookies';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Withdraw every count of the logout modal a request carries: expire both `COOKIE.logoutPending` and `COOKIE.logoutDeadline` in this response, the host-only copy and one for each domain {@link removalDomainsOf} names for the request's host, so that no count a closed tab left can end a session this browser signs in. Every sign-in the server makes calls it once it has signed the user in, and every sign-out the server makes on a request's own client, other than the request hook's, has its call at the point the next paragraph names.
 *
 * The three sign-in actions the gate protects, the password sign-ins of both apps and the code sign-in, call it once their helper has admitted the session, before the redirect, so a refused sign-in keeps the count. `verifyMailedLink`, for the confirm page, and the identity provider's callback call it once `verifyOtp` has set the session. The confirm page's sign-out of a held session leaves the count to that verification, and one that fails and leaves a session ends on the error page with the count kept; `verifyMailedLink`'s sign-out after a failed claim ends the session the link has just set, after the withdrawal. The Contestant App's protected loads call it once their sign-out has worked or found the session gone, so a failed sign-out that leaves a session keeps the count for the request hook. The logout endpoint calls it before its sign-out, so a Log out that fails is answered to the page and not made again by the server.
 *
 * The removals carry the attributes the page and the request hook write the two cookies with, `Secure` only on an `https:` address, so a browser on plain HTTP accepts them.
 *
 * Does nothing for a request that carries neither cookie. Does nothing either when the settled marker {@link LOGOUT_DEADLINE_SETTLED} stands, whether the request carried it or the request hook wrote it into this response when it signed the request out: the page reads the marker to discard the drafts of the session the server ended, and removes it itself.
 *
 * @param event - The request's cookies, its `Cookie` header and its address.
 */
export function withdrawLogoutDeadline({
  cookies,
  request,
  url
}: Pick<RequestEvent, 'cookies' | 'request' | 'url'>): void {
  const header = request.headers.get('cookie');
  const pendingValues = cookieValues(header, COOKIE.logoutPending);
  const deadlineValues = cookieValues(header, COOKIE.logoutDeadline);
  if (pendingValues.length === 0 && deadlineValues.length === 0) return;
  if (logoutDeadlineState(pendingValues, deadlineValues) === 'settled') return;
  if (cookies.get(COOKIE.logoutPending) === LOGOUT_DEADLINE_SETTLED) return;
  const attributes = { path: '/', httpOnly: false, sameSite: 'lax', secure: url.protocol === 'https:' } as const;
  for (const name of [COOKIE.logoutPending, COOKIE.logoutDeadline]) {
    cookies.delete(name, attributes);
    for (const domain of removalDomainsOf(url.hostname)) cookies.delete(name, { ...attributes, domain });
  }
}
