import { log } from '@openvaa/app-shared';
import { fail } from '@sveltejs/kit';
import { createDataWriter } from '$lib/api/dataWriter';
import { getLocale } from '$lib/paraglide/runtime';
import { condenseArguments } from '$lib/server/admin/features/condenseArguments';
import { requireAdminAction } from '$lib/server/admin/requireAdminAction';
import type { Actions } from '@sveltejs/kit';

/**
 * Handle form submit from the UI to start condensation.
 */
export const actions = {
  default: async ({ fetch, request, locals }) => {
    try {
      // THE ADMIN GATE, AND IT IS FIRST — before the form body is read, before the writer is constructed, before any writer call. Order is the property here, not presence: a gate placed after the writer call would let exactly the same work happen and would only change what is reported afterwards. Byte-identical to the two lines its sibling `question-info/+page.server.ts` opens with, because two spellings of one authorization decision is the drift this phase exists to remove.
      const denied = await requireAdminAction({ fetch, locals });
      if (denied) return denied;

      const lang = getLocale();
      const formData = await request.formData();
      const electionId = formData.get('electionId')?.toString();
      const questionIds = formData.getAll('questionIds').map((id) => id.toString());

      if (!electionId) {
        return fail(400, { type: 'error', error: 'Missing electionId' });
      }

      // This action's own writer, over the request-scoped client whose session was verified immediately above, so the job record below is written as the admin who submitted the form.
      const dataWriter = createDataWriter({ fetch, locals });

      const { email } = await dataWriter.getBasicUserData();

      // Start the job
      const jobInfo = await dataWriter.startJob({
        feature: 'ArgumentCondensation',
        author: email
      });

      // The job gets this request's own source, not this action's writer, so it builds ONE writer of its own and holds it for its whole run.
      const result = await condenseArguments({
        electionId,
        questionIds,
        source: { fetch, locals },
        locale: lang,
        jobId: jobInfo.id
      });
      return result ? { type: 'success' } : fail(500);
    } catch (err) {
      // THE INTERNAL DETAIL GOES TO THE LOG AND NOWHERE ELSE. The adapter's message names an internal API route and an internal class; a caller can act on neither, and this action used to return it verbatim in the response body while its sibling returned a generic string for the same failure. Byte-identical to the block its sibling `question-info/+page.server.ts` closes with, apart from this log's own prefix, because two answers to one failure is the same drift as two spellings of one authorization decision.
      log.error(`[Admin App argument condensation] ${err instanceof Error ? err.message : String(err)}`);
      return fail(500, { type: 'error', error: 'Internal server error' });
    }
  }
} satisfies Actions;
