import {getOpinionQuestions, getInfoQuestions} from '$lib/api/getData';
import type {LayoutServerLoad} from './$types';

export const load = (async ({parent}) => {
  const locale = (await parent()).i18n.currentLocale;
  return {
    // We need these for displaying the candidates
    questions: await getOpinionQuestions({locale}),
    infoQuestions: await getInfoQuestions({locale})
  };
}) satisfies LayoutServerLoad;
