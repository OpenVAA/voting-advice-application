import type { PageLoad } from './$types';

export const load: PageLoad = (async ({ params, url }) => {
  return {
    questionId: params.questionId,
    setQuestionAsFirst: url.searchParams.has('start')
  };
}) satisfies PageLoad;
