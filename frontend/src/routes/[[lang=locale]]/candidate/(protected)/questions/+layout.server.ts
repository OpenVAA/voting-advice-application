import type {LayoutServerLoad} from './$types';
import {dataProvider} from '$lib/api/getData';

export const load = (async ({parent}) => {
  const locale = (await parent()).i18n.currentLocale;
  const {getOpinionQuestions} = await dataProvider;
  return {
    opinionQuestionsSync: await getOpinionQuestions({locale})
  };
}) satisfies LayoutServerLoad;
