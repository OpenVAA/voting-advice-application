import type {LayoutServerLoad} from './$types';
import type {QueryFilter} from '$lib/vaa-data';
import {getDataProvider} from '$lib/server/config';

export const load: LayoutServerLoad = (async ({params}) => {
  // Get params
  const electionIds = params.electionIds.split(',');
  // Get data provider
  const dataProvider = getDataProvider();
  // Load data
  const filter: QueryFilter = {electionId: electionIds};
  return {
    constituencyCategoryData: await dataProvider.getConstituencyCategoryData(filter),
    selectedElectionIds: electionIds
  };
}) satisfies LayoutServerLoad;
