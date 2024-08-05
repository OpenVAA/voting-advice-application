import {dataProvider} from '$lib/_api/dataProvider';
import type {LayoutLoad} from './$types';

export const load: LayoutLoad = (async ({fetch, params}) => {
  const {electionId, constituencyId, lang} = params;
  const provider = await dataProvider;
  provider.init({fetch});
  return {
    nominationsData: provider.getNominationsData({
      electionId,
      constituencyId,
      locale: lang,
      loadAllEntities: true
    }),
    constituencyId
  };
}) satisfies LayoutLoad;
