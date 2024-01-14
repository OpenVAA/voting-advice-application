import type {PageLoad} from './$types';

export const load: PageLoad = (async ({params}) => {
  return {
    questionId: params.questionId
  };
}) satisfies PageLoad;
