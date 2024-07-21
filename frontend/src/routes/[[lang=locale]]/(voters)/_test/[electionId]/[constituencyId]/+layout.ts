import {dataProvider} from '$lib/_api/dataProvider';
import type {LayoutLoad} from './$types';

export const load: LayoutLoad = (async ({fetch, params}) => {
  const {electionId, constituencyId, lang} = params;
  const provider = await dataProvider;
  provider.init({fetch});
  const nominationsData = Promise.all([
    provider.getNominationsData({electionId, constituencyId, locale: lang}),
    provider.getCandidatesData({electionId, constituencyId, locale: lang})
  ]).then(([nominations, candidates]) => ({nominations, candidates}));
  return {
    nominationsData,
    constituencyId
  };
}) satisfies LayoutLoad;
