import type {LayoutServerLoad} from './$types';
import {getAppLabels, getElection} from '$lib/api/getData';

export const load = (async () => {
  return {
    appLabels: await getAppLabels(),
    election: await getElection()
  };
}) satisfies LayoutServerLoad;
