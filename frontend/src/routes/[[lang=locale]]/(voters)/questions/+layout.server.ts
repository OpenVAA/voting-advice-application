import { dataProvider } from '$lib/api/getData';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ parent }) => {
  const locale = (await parent()).i18n.currentLocale;
  const { getOpinionQuestions } = await dataProvider;
  return {
    opinionQuestions: getOpinionQuestions({ locale })
  };
}) satisfies LayoutServerLoad;
