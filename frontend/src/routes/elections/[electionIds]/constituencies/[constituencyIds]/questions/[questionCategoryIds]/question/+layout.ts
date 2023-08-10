import type {LayoutLoad} from './$types';

export const load: LayoutLoad = (async ({params}) => {
  // Get cat ids from params
  const questionCategoryIds = params.questionCategoryIds.split(',');
  return {
    selectedQuestionCategoryIds: questionCategoryIds
  };
}) satisfies LayoutLoad;
