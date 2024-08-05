import {dataProvider} from '$lib/_api/dataProvider';
import type {LayoutLoad} from './$types';

export const load: LayoutLoad = (async ({fetch, params}) => {
  const {lang} = params;
  const provider = await dataProvider;
  provider.init({fetch});
  return {
    electionsData: provider.getElectionsData({locale: lang})
  };
}) satisfies LayoutLoad;
