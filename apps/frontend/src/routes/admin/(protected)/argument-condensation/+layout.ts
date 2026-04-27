/**
 * Load the data for a argument condensation.
 */
import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
import { getLocale } from '$lib/paraglide/runtime';

export async function load({ fetch }) {
  const lang = getLocale();

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
