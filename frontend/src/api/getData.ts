// Quick test function to get data from Strapi
// To be refactored (GraphQL in the future?)

import {constants} from '../utils/constants';

// TODO: Define what type of data this returns instead of just any
export const getData = async (endpoint: string): Promise<any> => {
  const url = `${constants.BACKEND_URL}/${endpoint}`;
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
  return await getData('api/candidates?populate=*').then((result) => {
    if (result && result.data) return result?.data;
  });
};
