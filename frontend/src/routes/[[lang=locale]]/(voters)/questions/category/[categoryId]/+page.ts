import type { PageLoad } from './$types';

export const load: PageLoad = (async ({ params }) => {
  return {
    categoryId: params.categoryId
  };
}) satisfies PageLoad;
