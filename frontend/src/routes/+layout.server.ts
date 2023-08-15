/*
 * In this and other +layout.server.ts files, we handle the data api calls
 * and pass their results to the relevant +layout.svelte files, which then
 * update the client-side stores with the data.
 *
 * Now, each level of calls is separated into a separate, nested layout
 * file pair, due to parameter passing. Another, perhaps more elegant,
 * options would be to have a single layout file pair that handles all of
 * the data calls based on which params are present. The params might be:
 *
 * 1. Query params instead of route params
 * 2. The layout file might be at the very bottom of an optional route
 *    hierarchy, such as
 *    ([[electionIds]]/[[constituencyIds]]/[[questionCategoryIds]]/)
 * 3. The params might be passed in a cookie
 * 4. The params might be stored on the server
 *
 * The issue, however, is how to avoid unnecessary reloading of data, such
 * as AppLabels.
 */

import type {LayoutData, LayoutServerLoad} from './$types';
import {getAppLabels, getDataProvider, getAppSettings} from '$lib/server/config';

export const load: LayoutServerLoad = (async () => {
  // Get data provider
  const dataProvider = getDataProvider();
  // Load data
  return {
    appLabels: await getAppLabels(),
    appSettings: await getAppSettings(),
    electionData: await dataProvider.getElectionData()
  } as LayoutData;
}) satisfies LayoutServerLoad;
