/**
 * An generic API route for getting data from server-dependent DataProviders.
 */

import {error} from '@sveltejs/kit';
import {DATA_COLLECTIONS, isDataCollection} from '$lib/_api/dataCollections';
import type {GetDataOptionsBase} from '$lib/_api/dataProvider.type';
import {serverDataProvider} from '$lib/server/_api/serverDataProvider';
import type {RequestHandler} from './$types';

export const GET: RequestHandler = async ({fetch, params, url}) => {
  console.info(`[debug] /api/data/${params.collection}/+server.ts: GET`);

  const provider = await serverDataProvider;
  if (!provider) error(500, 'No server data provider available');

  provider.init({fetch});

  const {collection} = params;
  if (!isDataCollection(collection)) error(500, 'No valid collection provided');

  const getDataMethod = DATA_COLLECTIONS[collection];
  const options = Object.fromEntries(url.searchParams.entries());
  const data = await provider[getDataMethod](options as GetDataOptionsBase);

  if (data instanceof Error) {
    console.error(`[debug] /api/data/${params.collection}/+server.ts: GET Error: ${data}`);
    error(500, data.message);
  }

  return new Response(data, {
    headers: {'Content-Type': 'application/json'}
  });
};
