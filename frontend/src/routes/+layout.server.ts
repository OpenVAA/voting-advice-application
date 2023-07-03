import {error} from '@sveltejs/kit';
import type {LayoutLoad} from './$types';
import {getData, getSingleTypeData} from '../api/getData';

export const load: LayoutLoad = (async ({fetch, params, route, url}) => {
  //TODO: Add filter to get the right election
  const election = await getData(
    'api/elections',
    new URLSearchParams({populate: 'electionAppLabel'})
  ).then((result) => {
    if (result?.data[0]?.attributes) {
      return result.data[0].attributes;
    }
    if (result?.error?.status === 404) {
      throw error(404, 'election not found');
    }
  });

  const appLabelId = election?.electionAppLabel?.data?.id;

  // //TODO add filter to get the labels for the correct election
  const appLabels = await getData(
    'api/election-app-labels',
    new URLSearchParams({
      'filters[id][$eq]': appLabelId,
      populate: '*'
    })
  )
    .then((result) => {
      if (result?.data[0]?.attributes) {
        return result.data[0].attributes;
      }
      if (result?.error?.status === 404) {
        throw error(404, 'election not found');
      }
    })
    .catch((error) => {
      console.error('Error in getting layout data from Strapi: ', ' - - - ', error);
    });

  if (appLabels?.error) {
    console.error('appLabels error', appLabels.error);
    throw error(appLabels.error.status, {message: appLabels.error.message});
  }

  return appLabels;
}) satisfies LayoutLoad;
