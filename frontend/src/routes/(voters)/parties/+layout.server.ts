import {getNominatingParties} from '$lib/api/getData';
import type {LayoutServerLoad} from './$types';

export const load = (async () => {
  return {
    parties: await getNominatingParties({constituencyId: '490'})
  };
}) satisfies LayoutServerLoad;
