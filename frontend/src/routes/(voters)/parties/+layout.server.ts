import {getNominatingParties} from '$lib/api/getData';
import type {LayoutServerLoad} from './$types';

export const load = (async () => {
  return {
    parties: await getNominatingParties()
  };
}) satisfies LayoutServerLoad;
