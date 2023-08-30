import type {LayoutServerLoad} from './$types';
import {getAppLabels} from '$lib/api/getData';

export const load: LayoutServerLoad = (async () => {
  return {
    appLabels: await getAppLabels()
  };
}) satisfies LayoutServerLoad;
