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

// import {StrapiDataProvider} from './strapiDataProvider';
// import type {StrapiDataProviderOptions} from './strapiDataProvider';
// import {constants} from '../utils/constants';

// const dpOptions: StrapiDataProviderOptions = {
//   backendUrl: constants.BACKEND_URL,
//   strapiToken: constants.STRAPI_TOKEN,
// };

export default {
  getAppLabels(): Promise<AppLabels> {
    return new Promise<AppLabels>((resolve) => {
      resolve({
        appTitle: 'Mock Voting Advice Application',
        electionsTitle: 'Choose Elections',
        constituenciesTitle: 'Choose Your Constituency'
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
    return new MockDataProvider();
    // return new StrapiDataProvider(dpOptions);
  }
} as AppConfig;
