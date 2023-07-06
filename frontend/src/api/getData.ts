// Quick test function to get data from Strapi
// To be refactored (GraphQL in the future?)

import {constants} from '../utils/constants';
import {browser} from '$app/environment';

// TODO: Define what type of data this returns instead of just any
export const getData = async ({fetch, params, route, url, endpoint}): Promise<any> => {
  const strapiParams = new URLSearchParams({populate: '*'});

  const backendURL = `${constants.BACKEND_URL}/${endpoint}?${strapiParams}`;

  return await fetch(backendURL, {
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
    .catch((error: any) =>
      console.error(`Error fetching data from Strapi: ${error} - 
      URL: ${backendUrl}`)
    );
};

// TODO: Define what type of data this returns instead of just any
export const getAllCandidates = async ({fetch}): Promise<any> => {
  return await getData({fetch, endpoint: 'api/candidates'}).then((result) => {
    if (result && result.data) return result?.data;
    else console.error('Could not retrieve result for all candidates');
  });
};
