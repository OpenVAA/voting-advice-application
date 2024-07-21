import {dataProvider} from '$lib/_api/dataProvider';
import type {LayoutLoad} from './$types';

export const load: LayoutLoad = (async ({fetch, params}) => {
  const {electionId, lang} = params;
  const provider = await dataProvider;
  provider.init({fetch});
  return {
    constituenciesData: provider.getConstituenciesData({electionId, locale: lang}),
    electionId
  };
}) satisfies LayoutLoad;
