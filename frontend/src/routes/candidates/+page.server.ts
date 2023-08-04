import {getAllCandidates} from '$lib/api/getData';
import type {PageServerLoad} from './$types';

export const load = (async () => {
  const candidates = await getAllCandidates();
  return {candidates};
}) satisfies PageServerLoad;
