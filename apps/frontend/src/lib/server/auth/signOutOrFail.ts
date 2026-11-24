import { log } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import { isSessionGone } from '$lib/api/adapters/supabase/sessionGone';
import { t } from '$lib/i18n';

/**
 * Sign the request's session out of this browser, or end the request on the error page when a session may be left.
 *
 * The sign-out has scope `local`, so the user's sessions on other devices are kept. A sign-out that fails, by answering `{ error }` or by rejecting, is logged with the label, and the request's client is then asked whether a session is left. When the call to the auth service is what failed, the auth client has removed the session before answering, and the removal of the cookies is written to this request's response, so the client answers no session and this returns as after a sign-out that worked. When the client answers a session or an error, it throws a 503: a caller that redirects to the login page would send a live session there, where the gate sends it straight back.
 *
 * Tested in `signOutOrFail.test.ts`.
 * @param locals - The request's locals, whose `supabase` client holds the session to end.
 * @param logLabel - The prefix of the logged failure, naming the caller.
 * @returns Once no session is left.
 * @throws SvelteKit's 503 with the text of `error.default` when a session may be left.
 */
export async function signOutOrFail(locals: App.Locals, logLabel: string): Promise<void> {
  const failure = await locals.supabase.auth.signOut({ scope: 'local' }).then(
    (answer) => answer.error,
    (e: Error | undefined) => e ?? new Error('-')
  );
  if (!failure) return;
  log.error(`${logLabel}: signing out failed: ${failure.message ?? '-'}`);
  if (!(await isSessionGone(locals.supabase))) error(503, { message: t('error.default') });
}
