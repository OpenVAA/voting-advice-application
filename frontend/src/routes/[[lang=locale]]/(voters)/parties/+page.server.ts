import {getNominatingParties} from '$lib/api/getData';
import type {PageServerLoad} from './$types';

export const load = (async () => {
  return {
    parties: await getNominatingParties()
  };
}) satisfies PageServerLoad;
