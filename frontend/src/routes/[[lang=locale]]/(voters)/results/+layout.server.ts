import {
  getInfoQuestions,
  getNominatedCandidates,
  getNominatingParties,
  getOpinionQuestions
} from '$lib/api/getData';
import type {LayoutServerLoad} from './$types';

export const load = (async ({parent}) => {
  const locale = (await parent()).i18n.currentLocale;
  return {
    candidates: getNominatedCandidates({loadAnswers: true, locale}),
    parties: getNominatingParties({loadAnswers: true, locale}),
    opinionQuestions: getOpinionQuestions({locale}),
    infoQuestions: getInfoQuestions({locale})
  };
}) satisfies LayoutServerLoad;
