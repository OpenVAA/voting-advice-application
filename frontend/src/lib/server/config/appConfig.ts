/*
 * This file should be implementation-spefic.
 *
 * Also, we are creating a new instance of the provider each time.
 * Technically, the provider could be shared among clients as it runs
 * on the server and doesn't store sensitive data. However, if it were
 * to crash, that might be a problem.
 *
 * TO DO: Define a proper interface for an AppConfig and export just
 * that object from here. It should contain getDataProvider and
 * appSettings within it and might already merge appSettings with
 * DEFAULT_SETTINGS.
 */

import {type DataProvider, MockDataProvider} from '$lib/vaa-data';
import type {Settings} from '$lib/stores';
import type {AppLabels} from '$types';
import type {AppConfig} from './appConfig.type';

import {constants} from './constants';
import {error} from '@sveltejs/kit';

// STASHED: These are needed for a StrapiDataProvider implementation.
// import {StrapiDataProvider} from './strapiDataProvider';
// import type {StrapiDataProviderOptions} from './strapiDataProvider';
// const dpOptions: StrapiDataProviderOptions = {
//   backendUrl: constants.BACKEND_URL,
//   strapiToken: constants.STRAPI_TOKEN,
// };

// STASHED: This is the old getData stuff for getting the appLabels from
// Strapi.

// const getData = async (
//   endpoint: string,
//   params: URLSearchParams = new URLSearchParams({})
// ): Promise<any> => {
//   const url = `${constants.BACKEND_URL}/${endpoint}?${params}`;

//   return await fetch(url, {
//     headers: {
//       Authorization: `Bearer ${constants.STRAPI_TOKEN}`
//     }
//   })
//     .then((response) => {
//       return response.json();
//     })
//     .catch((error) => console.error('Error in getting data from backend: ', error));
// };

// //TODO: Add filter to get the right election
// const election = await getData(
//   'api/elections',
//   new URLSearchParams({populate: 'electionAppLabel'})
// ).then((result) => {
//   if (result?.data[0]?.attributes) {
//     return result.data[0].attributes;
//   }
//   if (result?.error?.status === 404) {
//     throw error(404, 'election not found');
//   }
// });

// const appLabelId = election?.electionAppLabel?.data?.id;

// // //TODO add filter to get the labels for the correct election
// const appLabels = await getData(
//   'api/election-app-labels',
//   new URLSearchParams({
//     'filters[id][$eq]': appLabelId,
//     populate: '*'
//   })
// )
//   .then((result) => {
//     if (result?.data[0]?.attributes) {
//       return result.data[0].attributes;
//     }
//     if (result?.error?.status === 404) {
//       throw error(404, 'election not found');
//     }
//   })
//   .catch((error) => {
//     console.error('Error in getting layout data from Strapi: ', ' - - - ', error);
//   });

// if (appLabels?.error) {
//   console.error('appLabels error', appLabels.error);
//   throw error(appLabels.error.status, {message: appLabels.error.message});
// }

// return appLabels;

export default {
  getAppLabels(): Promise<AppLabels> {
    return new Promise<AppLabels>((resolve) => {
      resolve({
        appTitle: 'Mock Voting Advice Application',
        electionsTitle: 'Choose Elections',
        constituenciesTitle: 'Choose Your Constituency',
        viewTexts: {
          questionsTip: 'Question Tip'
        },
        actionLabels: {
          results: 'Go to results'
        }
      });
    });
  },

  getAppSettings(): Promise<Settings> {
    return new Promise<Settings>((resolve) => {
      resolve({
        electionsAllowSelectMultiple: true
      });
    });
  },

  getDataProvider(): DataProvider {
    // TO DO: Change to StrapiDataProvider and implement everything
    // in MockDataProvider for it.
    // return new StrapiDataProvider(dpOptions);
    return new MockDataProvider();
  }
} as AppConfig;
