import { redirect } from '@sveltejs/kit';
import { buildRoute } from '$lib/routes';
import { withdrawLogoutDeadline } from '$lib/server/auth/logoutDeadline';
import { signOutOrFail } from '$lib/server/auth/signOutOrFail';
import type { RequestEvent } from '@sveltejs/kit';
import type { ContestantLoginError } from '$contestant/utils/loginError';

/**
 * Sign the user out of this browser and redirect to the Contestant App's login page, which shows the message of the given error.
 *
 * The sign-out, through `signOutOrFail`, has scope `local`, so the user's sessions on other devices are kept. A sign-out that fails, by answering `{ error }` or by rejecting, is logged, and the request's client is then asked whether a session is left. When the call to the auth service is what failed, the auth client has removed the session before answering, and the removal of the cookies is written to this request's response, so the client answers no session and the redirect follows as after a sign-out that worked. When the client answers a session or an error, the failure ends on the error page with no redirect: the gate sends a live session straight back from the login page, and the load that called this would fail again.
 *
 * Only once the outcome is known, after a sign-out that worked or a failed one that left no session, does `withdrawLogoutDeadline` expire every count of the logout modal the request carries, in the response that redirects, so that no count a closed tab left can end a session this browser signs in later. The error page keeps the count: the session it was meant to end is still there, so once the count has run out the request hook signs out the browser's next request.
 *
 * The sign-out runs on the event's client and the withdrawal writes to the event's cookies, so both act on one request.
 *
 * @param event - The request's locals, whose `supabase` client holds the session to end, and its cookies, its `Cookie` header and its address, whose logout count is withdrawn.
 * @param locale - The locale of the login page to redirect to.
 * @param code - The login-error code, passed to the login page as `errorMessage`.
 * @returns Never: it always throws, SvelteKit's 307 redirect when no session is left and a 503 when one may be.
 */
export async function signOutToLogin(
  event: Pick<RequestEvent, 'cookies' | 'request' | 'url' | 'locals'>,
  locale: string,
  code: ContestantLoginError
): Promise<never> {
  await signOutOrFail(event.locals, '[Contestant App protected layout]');
  withdrawLogoutDeadline(event);
  redirect(
    307,
    buildRoute({
      route: 'ContestantAppLogin',
      locale,
      errorMessage: code
    })
  );
}
