import type {PageLoad} from './$types';

export const load: PageLoad = (async ({params}) => {
  return {
    partyId: params.partyId
  };
}) satisfies PageLoad;
