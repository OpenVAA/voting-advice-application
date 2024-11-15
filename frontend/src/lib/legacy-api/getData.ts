/**
 * This is the main access point for the Voter App API.
 *
 * Based on local `settings`, the module will import the appropriate `DataProvider` and exports its functions.
 *
 * NB. In the frontend, always use the functions exposed by this module, never direct imports from the specific `DataProvider` implementations.
 */

import { staticSettings } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import type { DataProvider } from './dataProvider/dataProvider';

let dpPromise: Promise<{ dataProvider: DataProvider }>;

if (staticSettings.dataProvider.type === 'strapi') {
  dpPromise = import('./dataProvider/strapi');
} else if (staticSettings.dataProvider.type === 'local') {
  dpPromise = import('./dataProvider/local');
} else {
  throw error(500, 'Could not load data provider');
}

export const dataProvider: Promise<WithRequired<DataProvider, 'setFeedback'>> = dpPromise.then(
  async ({ dataProvider }) => {
    if (!('setFeedback' in dataProvider) || typeof dataProvider.setFeedback !== 'function')
      dataProvider.setFeedback = (await import('./dataProvider/local/setFeedback')).setFeedback;
    return dataProvider as WithRequired<DataProvider, 'setFeedback'>;
  }
);
