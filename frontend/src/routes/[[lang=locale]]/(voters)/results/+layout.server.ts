import type { LayoutServerLoad } from './$types';
import { dataProvider } from '$lib/api/getData';

export const load = (async ({ parent }) => {
  const locale = (await parent()).i18n.currentLocale;
  const { getInfoQuestions, getNominatedCandidates, getNominatingParties, getOpinionQuestions } =
    await dataProvider;
  return {
    candidates: getNominatedCandidates({ loadAnswers: true, locale }),
    parties: getNominatingParties({ loadAnswers: true, locale }),
    opinionQuestions: getOpinionQuestions({ locale }),
    infoQuestions: getInfoQuestions({ locale })
  };
}) satisfies LayoutServerLoad;
