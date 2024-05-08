import {getOpinionQuestions, getInfoQuestions, getNominatedCandidates} from '$lib/api/getData';
import type {PageServerLoad} from './$types';

export const load = (async ({parent}) => {
  const locale = (await parent()).i18n.currentLocale;
  // TODO: Get candidate data on the client side using the id in AuthContext
  return {
    opinionQuestions: getOpinionQuestions({locale}),
    infoQuestions: getInfoQuestions({locale}),
    candidates: getNominatedCandidates({loadAnswers: true, locale})
  };
}) satisfies PageServerLoad;
