/**
 * Load the data for a logged-in candidate.
 * - Load user data via DataWriter
 * - Load relevant question data based on the candidate's nominations via DataProvider
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

export async function load({ fetch, parent }) {
  const lang = getLocale();

  // Init dataWriter
  const dataWriter = await dataWriterPromise;
  dataWriter.init({ fetch });

  // Get authToken
  const authToken = (await parent()).token;
  if (!authToken)
    return redirect(
      307,
      buildRoute({
        route: 'CandAppLogin',
        locale: lang
      })
    );

  // Get user data
  const userData = await dataWriter.getCandidateUserData({ authToken, loadNominations: true }).catch((e) => {
    logDebugError(`Error fetching user data: ${e?.message ?? 'No error message'}`);
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
  dataProvider.init({ fetch });

  // Await questionData to avoid SvelteKit streaming issues in dev mode.
  // Without await, the Promise is streamed to the client, but Vite's dev
  // server may not complete the stream properly after a form action redirect.
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
    await dataWriter
      .logout({ authToken: authToken ?? '' })
      .catch((e) => logDebugError(`[Candidate App protected layout] Error logging out: ${e?.message ?? '-'}`));
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
