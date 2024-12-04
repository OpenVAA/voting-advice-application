/**
 * An generic API route for getting data from server-dependent DataProviders.
 */
import { error } from '@sveltejs/kit';
import qs from 'qs';
import { DP_METHOD, isDPDataType } from '$lib/api/base/dataTypes';
import { dataProvider } from '$lib/server/api/dataProvider';
import type { GetDataOptionsBase } from '$lib/api/base/getDataOptions.type';

export async function GET({ params, url }) {
  if (!dataProvider) error(500, 'No server data provider available');

  const { collection } = params;
  if (!isDPDataType(collection)) error(500, 'No valid collection provided');
  const getDataMethod = DP_METHOD[collection];

  let options: GetDataOptionsBase | undefined;
  try {
    options = qs.parse(url.search.replace(/^\?/g, ''));
  } catch {
    error(500, 'Error parsing query parameters');
  }

  return dataProvider[getDataMethod](options).catch((err: Error) => {
    error(500, err.message);
  });
}
