import { QUESTION_INFO_OPERATION } from '@openvaa/question-info';
import { fail } from '@sveltejs/kit';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { AUTH_TOKEN_KEY } from '$lib/auth';
import { generateQuestionInfo } from '$lib/server/admin/features/generateQuestionInfo';
import type { Actions } from '@sveltejs/kit';

/**
 * Handle form submit from the UI to start question info generation.
 */
export const actions: Actions = {
  default: async ({ fetch, request, params: { lang }, cookies }) => {
    try {
      console.info('[question-info] action start');
      const formData = await request.formData();
      const electionId = formData.get('electionId')?.toString();
      const questionIds = formData.getAll('questionIds').map((id) => id.toString());
      const operationsString = formData.get('operations')?.toString() || '';
      const sectionTopicsString = formData.get('sectionTopics')?.toString() || '';
      const customInstructions = formData.get('customInstructions')?.toString() || '';
      const questionContext = formData.get('questionContext')?.toString() || '';

      console.info('[question-info] parsed form', {
        electionId,
        nQuestionIds: questionIds.length,
        operations: operationsString,
        sectionTopics: sectionTopicsString,
        customInstructions,
        questionContext
      });

      if (!electionId) {
        console.warn('[question-info] early exit: missing electionId');
        return fail(400, { type: 'error', error: 'Missing electionId' });
      }

      // Parse operations
      const operations = operationsString.split(',').filter((op) => op.trim());
      if (operations.length === 0) {
        console.warn('[question-info] early exit: no operations selected');
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

      // Get the authentication token from cookies
      const authToken = cookies.get(AUTH_TOKEN_KEY);
      if (!authToken) return fail(401, { type: 'error', error: 'Authentication required' });

      // Prepare dataWriter and get user data
      const dataWriter = await dataWriterPromise;
      dataWriter.init({ fetch });

      const { email } = await dataWriter.getBasicUserData({ authToken });

      // Start the job
      const jobInfo = await dataWriter.startJob({
        feature: 'QuestionInfoGeneration',
        author: email,
        authToken
      });

      console.info('[question-info] created job:', jobInfo?.id);

      // Run the generation
      console.info('[question-info] calling generateQuestionInfo()…');
      const result = await generateQuestionInfo({
        electionId,
        questionIds,
        fetch,
        locale: lang || 'en',
        jobId: jobInfo.id,
        authToken,
        operations: operationEnums,
        sectionTopics: sectionTopics.length > 0 ? sectionTopics : undefined,
        customInstructions: customInstructions || undefined,
        questionContext: questionContext || undefined
      });
      console.info('[question-info] generateQuestionInfo() returned', result);

      return result ? { type: 'success' } : fail(500);
    } catch (error) {
      console.error('[question-info] error:', error);
      return fail(500, { type: 'error', error: 'Internal server error' });
    }
  }
};
