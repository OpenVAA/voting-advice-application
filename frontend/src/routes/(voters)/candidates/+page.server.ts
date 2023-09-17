import {getNominatedCandidates} from '$lib/api/getData';
import type {PageServerLoad} from './$types';

export const load = (async () => {
  return {
    candidates: await getNominatedCandidates()
  };
}) satisfies PageServerLoad;
