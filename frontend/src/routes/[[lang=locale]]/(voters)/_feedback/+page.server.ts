import type {PageServerLoad} from './$types';
import {getFeeback} from '$lib/api/getData';

export const load = (async () => {
  return {
    feedback: getFeeback()
  };
}) satisfies PageServerLoad;
