import { fail } from '@sveltejs/kit';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { condenseArguments } from '$lib/server/admin/features/condenseArguments';
import type { Actions } from '@sveltejs/kit';

/**
 * Handle form submit from the UI to start condensation.
 */
export const actions = {
  default: async ({ fetch, request, params: { lang }, locals }) => {
    try {
      console.info('[condense] action start');
      const formData = await request.formData();
      const electionId = formData.get('electionId')?.toString();
      const questionIds = formData.getAll('questionIds').map((id) => id.toString());
      console.info('[condense] parsed form', { electionId, nQuestionIds: questionIds.length });

      if (!electionId) {
        console.warn('[condense] early exit: missing electionId');
        return fail(400, { type: 'error', error: 'Missing electionId' });
      }

      // Prepare dataWriter with server client for session-based auth
      const dataWriter = await dataWriterPromise;
      dataWriter.init({ fetch, serverClient: locals.supabase });

      const { email } = await dataWriter.getBasicUserData({ authToken: '' });

      // Start the job
      const jobInfo = await dataWriter.startJob({
        feature: 'ArgumentCondensation',
        author: email,
        authToken: ''
      });

      console.info('[condense] startJob returned:', jobInfo);
      console.info('[condense] jobInfo type:', typeof jobInfo);
      console.info('[condense] jobInfo keys:', Object.keys(jobInfo || {}));
      console.info('[condense] created job (or at least tried to):', jobInfo?.id);

      // DEBUG: Check if the job was created and is in active state
      const jobData = await dataWriter.getJobProgress({
        jobId: jobInfo.id,
        authToken: ''
      });

      console.info('[condense] job initial state:', {
        id: jobData.id,
        status: jobData.status,
        progress: jobData.progress,
        feature: jobData.jobType
      });

      console.info('[condense] calling condenseArguments()…');
      const result = await condenseArguments({
        electionId,
        questionIds,
        fetch,
        locale: lang as string,
        jobId: jobInfo.id,
        authToken: ''
      });
      console.info('[condense] condenseArguments() returned', result);

      return result ? { type: 'success' } : fail(500);
    } catch (err) {
      console.error('[condense] error', err);
      const message = err instanceof Error ? err.message : String(err);
      return fail(500, { type: 'error', error: message });
    }
  }
} satisfies Actions;
