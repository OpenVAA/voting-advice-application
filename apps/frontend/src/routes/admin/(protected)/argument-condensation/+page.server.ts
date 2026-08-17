import { fail } from '@sveltejs/kit';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { getLocale } from '$lib/paraglide/runtime';
import { condenseArguments } from '$lib/server/admin/features/condenseArguments';
import { logDebugError } from '$lib/utils/logger';
import type { Actions } from '@sveltejs/kit';

/**
 * Handle form submit from the UI to start condensation.
 */
export const actions = {
  default: async ({ fetch, request, locals }) => {
    try {
      const lang = getLocale();
      const formData = await request.formData();
      const electionId = formData.get('electionId')?.toString();
      const questionIds = formData.getAll('questionIds').map((id) => id.toString());

      if (!electionId) {
        return fail(400, { type: 'error', error: 'Missing electionId' });
      }

      // Verify Supabase session
      const { session } = await locals.safeGetSession();
      if (!session) return fail(401, { type: 'error', error: 'Authentication required' });

      // Prepare dataWriter and get user data
      const dataWriter = await dataWriterPromise;
      dataWriter.init({ fetch });

      const { email } = await dataWriter.getBasicUserData({ authToken: '' });

      // Start the job
      const jobInfo = await dataWriter.startJob({
        feature: 'ArgumentCondensation',
        author: email,
        authToken: ''
      });

      const result = await condenseArguments({
        electionId,
        questionIds,
        fetch,
        locale: lang,
        jobId: jobInfo.id,
        authToken: ''
      });
      return result ? { type: 'success' } : fail(500);
    } catch (err) {
      logDebugError(`[Admin App argument condensation] ${err instanceof Error ? err.message : String(err)}`);
      const message = err instanceof Error ? err.message : String(err);
      return fail(500, { type: 'error', error: message });
    }
  }
} satisfies Actions;
