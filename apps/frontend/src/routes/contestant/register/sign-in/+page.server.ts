/**
 * # The server side of the code sign-in screen
 *
 * The load serves the screen only where the project's registration lists the code mode, and leads to the login page otherwise. So the screen is refused while answers are locked, under which no registration mode is listed, and while the code mode is off, although what it does is a sign-in: a user who registered with a code then signs in on the email sign-in screen, with the address the code was claimed with and the same password.
 *
 * The action signs in the user who claimed a registration code, with that code and their password, and redirects to the app's home.
 *
 * A load runs to render a page and not before a form action, so the action asks the same guard itself, before anything else: a post is refused where the screen would not be served. That refusal is the answer every other refusal gets, so a post cannot tell a project that does not offer the code mode from a wrong password.
 *
 * The code is a credential: whoever holds it can try a password against the account that claimed it. It therefore arrives in the body of the posted form, in a hidden field the page fills from memory, and is read from nowhere else. An address is stored in the browser's history, sent on as a referrer and written to request logs, and a form's body is none of those, so the action reads nothing of the request's address and takes no redirect target.
 *
 * After the guard the action calls the shared code sign-in helper once and does nothing else before that call. The helper signs in, then claims the user's invitations and refreshes the session when a grant was written, and only then reads the session and applies its grant gate. It is handed this request's own auth surface and session reader. The sign-in and the claim run on one data writer, built for this request when the helper first asks for it; the writer establishes the session on this request's own client, which is what puts the session cookies on this action's response.
 *
 * Every refusal is answered in one form: a failure with a status, which the failure's data repeats. The helper's refusals carry the helper's status. An unknown code, a wrong password, an account with no password, a spent attempt budget and a project that does not offer the code mode are all the same refusal with status 400, so the answer says nothing of the account behind a code.
 *
 * Tested in `page.server.test.ts`.
 */

import { fail, redirect } from '@sveltejs/kit';
import { createDataWriter } from '$lib/api/dataWriter';
import { CONTESTANT_GRANTS, invitationCodeLogin } from '$lib/auth';
import { buildRoute } from '$lib/routes';
import { isRegistrationOffered, refuseUnlessRegistrationOffered } from '$lib/server/contestant/registrationGuard';

export async function load(event) {
  await refuseUnlessRegistrationOffered(event, 'code');
}

export const actions = {
  default: async ({ request, locals, fetch }) => {
    if (!(await isRegistrationOffered({ fetch }, 'code'))) return fail(400, { status: 400 });

    const data = await request.formData();

    let writer: ReturnType<typeof createDataWriter> | undefined;
    /** The one data writer of this request, built on the first call. */
    function requestWriter(): ReturnType<typeof createDataWriter> {
      writer ??= createDataWriter({ fetch, locals });
      return writer;
    }

    const outcome = await invitationCodeLogin({
      context: {
        auth: locals.supabase.auth,
        getSession: locals.safeGetSession,
        claimInvitations: () => requestWriter().claimInvitations(),
        signInWithInvitationCode: async (credentials) =>
          (await requestWriter().signInWithInvitationCode(credentials)).type === 'success'
      },
      code: data.get('code') as string,
      password: data.get('password') as string,
      allowedGrants: CONTESTANT_GRANTS,
      logLabel: 'Contestant code sign-in'
    });
    if (!outcome.ok) return fail(outcome.status, { status: outcome.status });
    return redirect(303, buildRoute({ route: 'ContestantAppHome', locale: locals.currentLocale }));
  }
};
