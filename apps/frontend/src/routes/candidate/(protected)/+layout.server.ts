/**
 * Load the data for a logged-in candidate (server-side).
 *
 * Uses `event.locals.supabase` as the server client for the DataWriter,
 * ensuring authenticated RPC calls use the session from cookies.
 *
 * Redirects to login with an error message if the user is not logged in.
 */

import { redirect } from '@sveltejs/kit';
import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { getLocale } from '$lib/paraglide/runtime';
import { logDebugError } from '$lib/utils/logger';
import { removeDuplicates } from '$lib/utils/removeDuplicates';
import { buildRoute } from '$lib/utils/route';
import type { Id } from '@openvaa/core';
import type { CandidateLoginError } from '$candidate/utils/loginError';

export async function load({ fetch, locals }) {
  const lang = getLocale();

  // Init dataWriter with the server client from hooks.server.ts.
  // This ensures authenticated calls (getCandidateUserData, etc.)
  // use the session cookies from the request.
  const dataWriter = await dataWriterPromise;
  dataWriter.init({ fetch, serverClient: locals.supabase });

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

  // Get user data -- authToken is '' because Supabase uses cookie-based sessions
  const userData = await dataWriter.getCandidateUserData({ authToken: '', loadNominations: true }).catch((e) => {
    logDebugError(`Error fetching user data: ${e?.message ?? 'No error message'}`, e);
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

  // Get question data
  const dataProvider = await dataProviderPromise;
  dataProvider.init({ fetch, serverClient: locals.supabase });

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
    await locals.supabase.auth.signOut({ scope: 'local' })
      .catch((e: Error) => logDebugError(`[Candidate App protected layout] Error logging out: ${e?.message ?? '-'}`));
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
