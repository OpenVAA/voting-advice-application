/**
 * This legacy implementation always uses Strapi as the data provider.
 */
import { staticSettings } from '@openvaa/app-shared';
import { logDebugError } from '$lib/utils/logger';
import type { DataProvider } from './dataProvider/dataProvider';

if (staticSettings.dataAdapter.type !== 'strapi')
  logDebugError(
    '[legacy-api] Until the legacy API is removed, legacy-api will always use Strapi as the data provider.'
  );

const dpPromise: Promise<{ dataProvider: DataProvider }> = import('./dataProvider/strapi');

export const dataProvider: Promise<WithRequired<DataProvider, 'setFeedback'>> = dpPromise.then(
  async ({ dataProvider }) => {
    return dataProvider as WithRequired<DataProvider, 'setFeedback'>;
  }
);
