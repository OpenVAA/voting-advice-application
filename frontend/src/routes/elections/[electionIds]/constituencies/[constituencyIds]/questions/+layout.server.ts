import {redirect} from '@sveltejs/kit';
import type {LayoutServerLoad} from './$types';
import {getDataProvider} from '$lib/config';

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
  const questionCategoriesData = await dataProvider.getQuestionCategoriesData({
    constituencyId: constituencyIds
  });
  // We also need to already load the question data for these
  const questionIds = questionCategoriesData.map((c) => c.questionIds ?? []).flat();
  const questionsData = await dataProvider.getQuestionsData({id: questionIds});
  return {
    questionCategoriesData,
    questionsData,
    selectedConstituencyIds: constituencyIds
  };
}) satisfies LayoutServerLoad;
