import { dataProvider } from '$lib/legacy-api/getData';

export async function load({ parent }) {
  const locale = (await parent()).i18n.currentLocale;
  const { getOpinionQuestions } = await dataProvider;
  return {
    opinionQuestions: getOpinionQuestions({ locale })
  };
}
