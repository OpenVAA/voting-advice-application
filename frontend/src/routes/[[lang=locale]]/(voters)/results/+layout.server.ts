import {getInfoQuestions, getNominatedCandidates, getOpinionQuestions} from '$lib/api/getData';
import type {LayoutServerLoad} from './$types';

export const load = (async ({parent}) => {
  const locale = (await parent()).i18n.currentLocale;
  return {
    candidates: await getNominatedCandidates({loadAnswers: true, locale}),
    // We need these for displaying the candidates
    questions: await getOpinionQuestions({locale}),
    infoQuestions: await getInfoQuestions({locale})
  };
}) satisfies LayoutServerLoad;
