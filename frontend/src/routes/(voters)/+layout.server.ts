import {error} from '@sveltejs/kit';
import type {LayoutServerLoad} from './$types';
import {getData} from '$lib/api/getData';

export const load: LayoutServerLoad = (async (loadEvent) => {
  const {parent} = loadEvent;
  const {appLabels} = await parent();

  if (appLabels?.error) {
    console.error('appLabels error', appLabels.error);
    throw error(appLabels.error.status, {message: appLabels.error.message});
  }

  return appLabels;
}) satisfies LayoutServerLoad;
