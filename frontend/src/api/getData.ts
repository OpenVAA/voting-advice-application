// Quick test function to get data from Strapi
// To be refactored (GraphQL in the future?)

import {constants} from '../utils/constants';
import {browser} from '$app/environment';

// TODO: Define what type of data this returns instead of just any
export const getData = async (
  endpoint: string,
  params: URLSearchParams = new URLSearchParams({})
): Promise<any> => {
  const url = `${constants.BACKEND_URL}/${endpoint}?${params}`;

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

export const getSingleTypeData = async ({fetch, params, route, url, endpoint}): Promise<any> => {
  const backendUrl = `${constants.BACKEND_URL}/${endpoint}`;

  return await fetch(backendUrl, {
    headers: {
      Authorization: `Bearer ${constants.STRAPI_TOKEN}`
    }
  })
    .then((response: {json: () => any}) => {
      return response.json();
    })
    .catch((error: any) => console.error('Error fetching dta from Strapi', error));
};

// TODO: Define what type of data this returns instead of just any
export const getAllCandidates = async (): Promise<any> => {
  return await getData('api/candidates', new URLSearchParams({populate: '*'})).then((result) => {
    if (result && result.data) return result?.data;
    else console.error('Could not retrieve result for all candidates');
  });
};
