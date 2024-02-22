import type {PageLoad} from './$types';

export const load: PageLoad = (async ({params}) => {
  return {
    candidateId: params.candidateId
  };
}) satisfies PageLoad;
