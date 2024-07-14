import type { PageLoad } from './$types';

export const load: PageLoad = (async ({ params }) => {
  return {
    entityType: params.entityType,
    entityId: params.entityId
  };
}) satisfies PageLoad;
