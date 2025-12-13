/**
 * Load the data for a argument condensation.
 */
import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';

export async function load({ fetch, params: { lang } }) {
  // Get question data
  const dataProvider = await dataProviderPromise;
  dataProvider.init({ fetch });

  return {
    questionData: dataProvider
      .getQuestionData({
        locale: lang
      })
      .catch((e) => e)
  };
}
