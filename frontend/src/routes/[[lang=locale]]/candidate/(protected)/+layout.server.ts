/**
 * Load the data for a logged-in candidate.
 * - Verify session-based authentication
 * - Load user data via DataWriter
 * - Load relevant question data based on the candidate's nominations via DataProvider
 *
 * Redirects to login with an error message if the user is not logged in.
 */

import { redirect } from '@sveltejs/kit';
import { SupabaseDataProvider } from '$lib/api/adapters/supabase/dataProvider/supabaseDataProvider';
import { SupabaseDataWriter } from '$lib/api/adapters/supabase/dataWriter/supabaseDataWriter';
import { logDebugError } from '$lib/utils/logger';
import { removeDuplicates } from '$lib/utils/removeDuplicates';
import { buildRoute } from '$lib/utils/route';
import type { Id } from '@openvaa/core';
import type { CandidateLoginError } from '$candidate/utils/loginError';

export async function load({ fetch, locals, parent, params: { lang } }) {
  // Create per-request instances to avoid singleton race conditions
  // where concurrent requests overwrite each other's Supabase client via init()
  const dataWriter = new SupabaseDataWriter();
  dataWriter.init({ fetch, serverClient: locals.supabase, locale: locals.currentLocale });

  // Check for valid session
  const { session } = await parent();
  if (!session)
    return redirect(
      307,
      buildRoute({
        route: 'CandAppLogin',
        lang
      })
    );

  // Get user data
  const userData = await dataWriter.getCandidateUserData({ authToken: '', loadNominations: true }).catch((e) => {
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

  const dataProvider = new SupabaseDataProvider();
  dataProvider.init({ fetch, serverClient: locals.supabase, locale: locals.currentLocale });

  return {
    questionData: dataProvider
      .getQuestionData({
        electionId,
        locale: lang
      })
      .catch((e) => e),
    candidateUserData: userData
  };

  /**
   * Call logout and redirect to the login page with an error message.
   */
  async function handleError(error: CandidateLoginError): Promise<void> {
    await dataWriter
      .logout({ authToken: '' })
      .catch((e) => logDebugError(`[Candidate App protected layout] Error logging out: ${e?.message ?? '-'}`));
    redirect(
      307,
      buildRoute({
        route: 'CandAppLogin',
        lang,
        errorMessage: error
      })
    );
  }
}
