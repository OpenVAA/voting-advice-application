import { DataRoot } from '@openvaa/data';
import { type Actions, fail } from '@sveltejs/kit';
import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
import { isValidResult } from '$lib/api/utils/isValidResult';
import { getLLMProvider } from '$lib/server/llm/llmProvider';
import type { Id } from '@openvaa/core';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { DPDataType } from '$lib/api/base/dataTypes';

export const actions = {
  default: async ({ fetch, request, cookies, params: { lang } }) => {
    try {
      const formData = await request.formData();
      const electionId = formData.get('electionId');
      const questionIds = formData.getAll('questionIds').map((id) => id.toString());

      console.info('got', { electionId, questionIds });

      // TODO: Check inputs here

      // Call the generation function here
      const result = await condenseArguments({ electionId, questionIds, fetch, locale: lang });

      // When writing stuff to the backend, you'll need this
      // const authToken = cookies.get('token');

      return result
        ? {
            type: 'success'
          }
        : fail(500);
    } catch (err) {
      console.error('Error processing form:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      return fail(500, { type: 'error', error: `Failed to process form: ${errorMessage}` });
    }
  }
} satisfies Actions;

// Preferably place this somewhere else, though, so that we can call it from other sources as well
async function condenseArguments({
  electionId,
  questionIds,
  fetch,
  locale
}: {
  electionId: Id;
  questionIds: Array<Id>;
  authToken: string;
  fetch: Fetch;
  locale: string;
}): Promise<DataApiActionResult> {
  // Get data
  // TODO: Consider wrapping this in a reusable function `getFullElection` or smth. which the other admin functions can also use
  const dataRoot = new DataRoot();
  const dataProvider = await dataProviderPromise;
  dataProvider.init({ fetch });

  const [electionData, constituencyData, questionData, nominationData] = (await Promise.all([
    dataProvider.getElectionData({ locale }).catch((e) => e),
    dataProvider.getConstituencyData({ locale }).catch((e) => e),
    dataProvider
      .getQuestionData({
        electionId,
        locale
      })
      .catch((e) => e),
    dataProvider
      .getNominationData({
        electionId,
        locale
      })
      .catch((e) => e)
  ])) as [DPDataType['elections'], DPDataType['constituencies'], DPDataType['questions'], DPDataType['nominations']];

  if (!isValidResult(electionData)) throw new Error('Error loading constituency data');
  if (!isValidResult(constituencyData, { allowEmpty: true })) throw new Error('Error loading constituency data');
  if (!isValidResult(questionData, { allowEmpty: true })) throw new Error('Error loading question data');
  if (!isValidResult(nominationData, { allowEmpty: true })) throw new Error('Error loading nomination data');
  dataRoot.update(() => {
    dataRoot.provideElectionData(electionData);
    dataRoot.provideConstituencyData(constituencyData);
    dataRoot.provideQuestionData(questionData);
    dataRoot.provideEntityData(nominationData.entities);
    dataRoot.provideNominationData(nominationData.nominations);
  });

  // Do the deed here
  // You can now access all data via the dataRoot object

  const llm = getLLMProvider();

  return { type: 'success' };
}

type Fetch = typeof fetch;
