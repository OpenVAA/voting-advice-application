import type {LayoutServerLoad} from './$types';
import {getDataProvider} from '$lib/config';

export const load: LayoutServerLoad = (async ({params}) => {
  // Get params
  const electionIds = params.electionIds.split(',');
  // Get data provider
  const dataProvider = getDataProvider();
  // Load data. NB. We don't filter it bc it will be done by the derived store
  const constituencyCategoriesData = await dataProvider.getConstituencyCategoriesData();
  return {
    constituencyCategoriesData,
    selectedElectionIds: electionIds
  };
}) satisfies LayoutServerLoad;
