import { log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { buildRoute } from '$lib/routes';
import type { ContestantLoginError } from '$contestant/utils/loginError';

/**
 * Sign the user out of this browser and redirect to the Contestant App's login page, which shows the message of the given error.
 *
 * The sign-out has scope `local`, so the user's sessions on other devices are kept. A failed sign-out is logged and does not stop the redirect.
 *
 * @param locals - The request's locals, whose `supabase` client holds the session to end.
 * @param locale - The locale of the login page to redirect to.
 * @param error - The login-error code, passed to the login page as `errorMessage`.
 * @returns Never: it always throws SvelteKit's 307 redirect.
 */
export async function signOutToLogin(
  locals: Pick<App.Locals, 'supabase'>,
  locale: string,
  error: ContestantLoginError
): Promise<never> {
  await locals.supabase.auth
    .signOut({ scope: 'local' })
    .catch((e: Error) => log.error(`[Contestant App protected layout] Error logging out: ${e?.message ?? '-'}`));
  redirect(
    307,
    buildRoute({
      route: 'ContestantAppLogin',
      locale,
      errorMessage: error
    })
  );
}
