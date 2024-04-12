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
    questions: await getOpinionQuestions({locale}),
    infoQuestions: await getInfoQuestions({locale}),
    candidates: await getNominatedCandidates({loadAnswers: true, locale}),
    parties: await getNominatingParties({loadAnswers: true, locale})
  };
}) satisfies LayoutServerLoad;
