import {redirect} from '@sveltejs/kit';
import type {LayoutServerLoad} from './$types';
import {getDataProvider} from '$lib/server/config';

export const load: LayoutServerLoad = (async ({params, url}) => {
  const previousUrl = url.pathname.replace(/(\/constituencies)\/.*$/, '$1');
  // Get query params
  const constituencyIds = params.constituencyIds.split(',');
  if (constituencyIds.length === 0) {
    throw redirect(307, previousUrl);
  }
  // Get data provider
  const dataProvider = getDataProvider();
  // Load question categories data
  const questionCategoryData = await dataProvider.getQuestionCategoryData({
    constituencyId: constituencyIds
  });
  // We also need to already load the question data for these
  const questionIds = questionCategoryData.map((c) => c.questionIds ?? []).flat();
  return {
    questionTemplateData: await dataProvider.getQuestionTemplateData(),
    questionCategoryData,
    questionData: await dataProvider.getQuestionData({id: questionIds}),
    selectedConstituencyIds: constituencyIds
  };
}) satisfies LayoutServerLoad;
