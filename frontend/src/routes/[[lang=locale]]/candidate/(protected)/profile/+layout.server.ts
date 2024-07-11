import {dataProvider} from '$lib/api/getData';
import type {LayoutServerLoad} from './$types';

export const load = (async ({parent}) => {
  const locale = (await parent()).i18n.currentLocale;
  const {getInfoQuestions} = await dataProvider;
  return {
    infoQuestions: getInfoQuestions({locale})
  };
}) satisfies LayoutServerLoad;
