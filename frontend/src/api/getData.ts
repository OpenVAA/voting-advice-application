// Quick test function to get data from Strapi
// To be refactored (GraphQL in the future?)

import {constants} from '../utils/constants';
import {getCurrentLocale} from '../utils/i18n';

// TODO: Define what type of data this returns instead of just any
export const getData = async (
  endpoint: string,
  params: URLSearchParams = new URLSearchParams({})
): Promise<any> => {
  params.append('locale', getCurrentLocale());
  params.append('populate', '*');

  const url = `${constants.BACKEND_URL}/api/${endpoint}?${params}`;
  return await fetch(url, {
    headers: {
      Authorization: `Bearer ${constants.STRAPI_TOKEN}`
    }
  })
    .then((response) => {
      return response.json();
    })
    .catch((error) => console.error('Error in getting data from backend: ', error));
};

// TODO: Define what type of data this returns instead of just any
export const getAllCandidates = async (): Promise<any> => {
  return await getData('candidates').then((result) => {
    if (result && result.data) return result?.data;
    else console.error('Could not retrieve result for all candidates');
  });
};
