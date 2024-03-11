import {getNominatedCandidates} from '$lib/api/getData';
import type {PageServerLoad} from './$types';

export const load = (async ({parent}) => {
  const locale = (await parent()).i18n.currentLocale;
  return {
    candidates: await getNominatedCandidates({locale})
  };
}) satisfies PageServerLoad;
