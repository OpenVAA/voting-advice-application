import { type Actions, fail } from '@sveltejs/kit';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { condenseArguments } from '$lib/server/admin/features/condenseArguments';
import { AUTH_TOKEN_KEY } from '$lib/server/auth';
import type { JobProgressResult } from '../../../api/admin/jobs/[id]/progress/+server';
import type { JobStartParams, JobStartResult } from '../../../api/admin/jobs/start/+server';

/**
 * Handle form submit from the UI to start condensation.
 */
export const actions = {
  default: async ({ fetch, request, params: { lang }, cookies }) => {
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

      // Get the authentication token from cookies
      const authToken = cookies.get(AUTH_TOKEN_KEY);
      if (!authToken) return fail(401, { type: 'error', error: 'Authentication required' });

      // Prepare dataWriter and get user data
      const dataWriter = await dataWriterPromise;
      dataWriter.init({ fetch });

      const { email } = await dataWriter.getBasicUserData({ authToken });

      // Start job
      const jobResponse = await fetch('/api/admin/jobs/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'argument-condensation',
          author: email
        } as JobStartParams)
      });

      if (!jobResponse.ok) {
        console.error('[condense] Job creation failed:', await jobResponse.text());
        throw new Error('Failed to create job');
      }

      const { jobId } = (await jobResponse.json()) as JobStartResult;
      console.info('[condense] created job:', jobId);

      // DEBUG: Check if the job was created and is in active state
      const jobCheckResponse = await fetch(`/api/admin/jobs/${jobId}/progress`);

      if (jobCheckResponse.ok) {
        const jobData = (await jobCheckResponse.json()) as JobProgressResult;
        console.info('[condense] job initial state:', {
          id: jobData.id,
          status: jobData.status,
          progress: jobData.progress,
          feature: jobData.feature
        });
      } else {
        console.error('[condense] Failed to check job state:', jobCheckResponse.status);
      }

      console.info('[condense] calling condenseArguments()…');
      const result = await condenseArguments({
        electionId,
        questionIds,
        fetch,
        locale: lang as string,
        jobId,
        authToken // Add this parameter
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
