/*
 * This file should be implementation-spefic.
 *
 * Also, we are creating a new instance of the provider each time.
 * Technically, the provider could be shared among clients as it runs
 * on the server and doesn't store sensitive data. However, if it were
 * to crash, that might be a problem.
 *
 * TO DO: Define a proper interface for AppConfig and export just that
 * object from here.
 */

import type {DataProvider} from '$lib/api/dataProvider';
import {MockDataProvider} from '$lib/api/mockDataProvider';
import type {Settings} from '$lib/stores';
// import {StrapiDataProvider} from './strapiDataProvider';
// import type {StrapiDataProviderOptions} from './strapiDataProvider';
// import {constants} from '../utils/constants';

// const dpOptions: StrapiDataProviderOptions = {
//   backendUrl: constants.BACKEND_URL,
//   strapiToken: constants.STRAPI_TOKEN,
// };

export function getDataProvider(): DataProvider {
  return new MockDataProvider();
  // return new StrapiDataProvider(dpOptions);
}

export const appSettings: Settings = {
  electionsAllowSelectMultiple: true
} as const;
