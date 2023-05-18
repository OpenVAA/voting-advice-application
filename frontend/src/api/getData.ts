import {constants} from '../utils/constants';
import {getCurrentLocale} from '../utils/i18n';
import {logDebugError} from '../utils/logger';

/**
 * Makes a request to Strapi backend and returns the data.
 * TODO: Define return data type instead of "any"
 * @param route Backend api route to use without the server address or /api/
 * @param params Optional parameters to use on the request
 * @param fetchFunction Optional Svelte fetch function to use on load.
 * It is preferred to use fetch passed by Svelte on page load over Node.js native fetch.
 */
export async function getData(
  route: string,
  fetchFunction: any = null,
  params: URLSearchParams = new URLSearchParams({})
): Promise<any> {
  params.append('locale', getCurrentLocale());

  const url = `${constants.BACKEND_URL}/api/${route}?${params}`;

  if (!fetchFunction) {
    logDebugError(
      'Svelte fetch() was not defined for getData, and reverting back to native fetch()'
    );
    fetchFunction = fetch;
  }

  return await fetchFunction(url, {
    headers: {
      Authorization: `Bearer ${constants.STRAPI_TOKEN}`
    }
  })
    .then((response: any) => {
      return response.json();
    })
    .catch((error: any) => console.error('Error in getting data from backend: ', error));
}

// TODO: Define what type of data this returns instead of just any
export const getAllCandidates = async (fetchFunction: any = null): Promise<any> => {
  return await getData(
    'candidates',
    fetchFunction,
    new URLSearchParams({
      populate: '*'
    })
  ).then((result) => {
    if (result && result.data) return result?.data;
    else console.error('Could not retrieve result for all candidates');
  });
};
