import { log } from '@openvaa/app-shared';
import { QUESTION_INFO_OPERATION } from '@openvaa/question-info';
import { fail } from '@sveltejs/kit';
import { createDataWriter } from '$lib/api/dataWriter';
import { getLocale } from '$lib/paraglide/runtime';
import { generateQuestionInfo } from '$lib/server/admin/features/generateQuestionInfo';
import { requireAdminAction } from '$lib/server/admin/requireAdminAction';
import type { Actions } from '@sveltejs/kit';

/**
 * Handle form submit from the UI to start question info generation.
 */
export const actions: Actions = {
  default: async ({ fetch, request, locals }) => {
    try {
      // THE ADMIN GATE, AND IT IS FIRST — before the form body is read, before the writer is constructed, before any writer call. Order is the property here, not presence: a gate placed after the writer call would let exactly the same work happen and would only change what is reported afterwards. Byte-identical to the two lines its sibling `argument-condensation/+page.server.ts` opens with, because two spellings of one authorization decision is the drift this phase exists to remove.
      const denied = await requireAdminAction({ fetch, locals });
      if (denied) return denied;

      const lang = getLocale();
      const formData = await request.formData();
      const electionId = formData.get('electionId')?.toString();
      const questionIds = formData.getAll('questionIds').map((id) => id.toString());
      const language = formData.get('language')?.toString() || lang || 'en';
      const operationsString = formData.get('operations')?.toString() || '';
      const sectionTopicsString = formData.get('sectionTopics')?.toString() || '';
      const customInstructions = formData.get('customInstructions')?.toString() || '';
      const questionContext = formData.get('questionContext')?.toString() || '';

      if (!electionId) {
        return fail(400, { type: 'error', error: 'Missing electionId' });
      }

      // Parse operations
      const operations = operationsString.split(',').filter((op) => op.trim());
      if (operations.length === 0) {
        return fail(400, { type: 'error', error: 'No operations selected' });
      }

      // Map operation strings to enum values
      const operationEnums = operations.map((op) => {
        if (op === 'terms') return QUESTION_INFO_OPERATION.Terms;
        if (op === 'infoSections') return QUESTION_INFO_OPERATION.InfoSections;
        throw new Error(`Invalid operation: ${op}`);
      });

      // Parse section topics (comma-separated)
      const sectionTopics = sectionTopicsString
        .split(',')
        .map((topic) => topic.trim())
        .filter((topic) => topic.length > 0);

      // This action's own writer, over the request-scoped client whose session was verified immediately above, so the job record below is written as the admin who submitted the form.
      const dataWriter = createDataWriter({ fetch, locals });

      const { email } = await dataWriter.getBasicUserData();

      // Start the job
      const jobInfo = await dataWriter.startJob({
        feature: 'QuestionInfoGeneration',
        author: email
      });

      // Run the generation. The job gets this request's own source, not this action's writer, so it builds ONE writer of its own and holds it for its whole run.
      const result = await generateQuestionInfo({
        electionId,
        questionIds,
        source: { fetch, locals },
        locale: language,
        jobId: jobInfo.id,
        operations: operationEnums,
        sectionTopics: sectionTopics.length > 0 ? sectionTopics : undefined,
        customInstructions: customInstructions || undefined,
        questionContext: questionContext || undefined
      });
      return result ? { type: 'success' } : fail(500);
    } catch (err) {
      // THE INTERNAL DETAIL GOES TO THE LOG AND NOWHERE ELSE. The adapter's message names an internal API route and an internal class; a caller can act on neither, and this action's sibling used to return it verbatim in the response body while this one returned a generic string for the same failure. Byte-identical to the block its sibling `argument-condensation/+page.server.ts` closes with, apart from this log's own prefix, because two answers to one failure is the same drift as two spellings of one authorization decision.
      log.error(`[Admin App question info] ${err instanceof Error ? err.message : String(err)}`);
      return fail(500, { type: 'error', error: 'Internal server error' });
    }
  }
};
