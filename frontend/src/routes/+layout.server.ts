/*
 * In this and other +layout.server.ts files, we handle the data api calls
 * and pass their results to the relevant +layout.svelte files, which then
 * update the client-side stores with the data.
 */

import type {LayoutData, LayoutServerLoad} from './$types';
import appConfig from '$lib/server/config/appConfig';

export const load: LayoutServerLoad = (async () => {
  // Get data provider
  const dataProvider = appConfig.getDataProvider();
  // Load data
  return {
    appLabels: await appConfig.getAppLabels(),
    appSettings: await appConfig.getAppSettings(),
    electionData: await dataProvider.getElectionData()
  } as LayoutData;
}) satisfies LayoutServerLoad;
