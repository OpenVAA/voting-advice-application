import {
  getInfoQuestions,
  getNominatedCandidates,
  getNominatingParties,
  getOpinionQuestions
} from '$lib/api/getData';
import settings from '$lib/config/settings.json';
import type {LayoutServerLoad} from './$types';

export const load = (async ({parent}) => {
  const locale = (await parent()).i18n.currentLocale;
  const data: Partial<App.PageData> = {
    // We need these for displaying the candidates
    questions: await getOpinionQuestions({locale}),
    infoQuestions: await getInfoQuestions({locale})
  };
  if (settings.results.sections.includes('candidate'))
    data.candidates = await getNominatedCandidates({loadAnswers: true, locale});
  // TODO: Enable party rankings
  data.parties = await getNominatingParties({locale});
  return data as App.PageData;
}) satisfies LayoutServerLoad;
