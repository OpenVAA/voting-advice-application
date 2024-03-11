import type {LayoutServerLoad} from './$types';
import {getOpinionQuestions} from '$lib/api/getData';

export const load = (async ({parent}) => {
  const locale = (await parent()).i18n.currentLocale;
  return {
    questions: await getOpinionQuestions({locale})
  };
}) satisfies LayoutServerLoad;
