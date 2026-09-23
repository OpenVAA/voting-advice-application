/**
 * Load the data for a logged-in candidate (server-side).
 *
 * Uses `event.locals.supabase` as the server client for the DataWriter, ensuring authenticated RPC calls use the session from cookies.
 *
 * Redirects to login with an error message if the user is not logged in.
 */

import { log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { createDataProvider } from '$lib/api/dataProvider';
import { createDataWriter } from '$lib/api/dataWriter';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';
import { removeDuplicates } from '$lib/utils/removeDuplicates';
import type { Id } from '@openvaa/core';
import type { CandidateLoginError } from '$candidate/utils/loginError';

export async function load({ fetch, locals }) {
  const lang = getLocale();

  // A writer this request alone holds, over the cookie-bearing client `hooks.server.ts` built for this request, so the authenticated calls below (`getCandidateUserData`) run on THIS candidate's session cookies and cannot be rebound by a concurrent request.
  const dataWriter = createDataWriter({ fetch, locals });

  // Check for valid session
  const { session } = await locals.safeGetSession();
  if (!session)
    return redirect(
      307,
      buildRoute({
        route: 'CandAppLogin',
        locale: lang
      })
    );

  // Get user data -- Supabase uses cookie-based sessions
  const userData = await dataWriter.getCandidateUserData({ loadNominations: true }).catch((e) => {
    log.error(`Error fetching user data: ${e?.message ?? 'No error message'}`, { err: e });
    return undefined;
  });
  if (!userData) return await handleError('loginFailed');

  // Check that the data is valid and the user is a candidate
  const {
    user: { role },
    candidate,
    nominations: { nominations }
  } = userData;
  if (role !== 'candidate') return await handleError('userNotAuthorized');
  if (!candidate) return await handleError('userNoCandidate');

  // Parse the election and constituency ids
  let electionId = new Array<Id>();
  let constituencyId = new Array<Id>();
  if (nominations) {
    electionId = removeDuplicates(nominations.map((n) => n.electionId));
    constituencyId = removeDuplicates(nominations.map((n) => n.constituencyId));
  }
  if (!electionId.length || !constituencyId.length) return await handleError('candidateNoNomination');

  // Get the question data on this request's own provider instance, built over the same cookie-bearing client and likewise reachable from nowhere else.
  const dataProvider = createDataProvider({ fetch, locals });

  // Await questionData to avoid SvelteKit streaming issues in dev mode.
  const questionData = await dataProvider
    .getQuestionData({
      electionId,
      locale: lang
    })
    .catch((e) => e);

  return {
    questionData,
    candidateUserData: userData
  };

  /**
   * Call logout and redirect to the login page with an error message.
   */
  async function handleError(error: CandidateLoginError): Promise<void> {
    await locals.supabase.auth
      .signOut({ scope: 'local' })
      .catch((e: Error) => log.error(`[Candidate App protected layout] Error logging out: ${e?.message ?? '-'}`));
    redirect(
      307,
      buildRoute({
        route: 'CandAppLogin',
        locale: lang,
        errorMessage: error
      })
    );
  }
}
