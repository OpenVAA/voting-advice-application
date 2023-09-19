import type {LayoutServerLoad} from './$types';
import {getAppLabels, getElection} from '$lib/api/getData';
import {error} from '@sveltejs/kit';

export const load = (async () => {
  const appLabels = await getAppLabels();
  const election = await getElection();
  if (!appLabels || !election) {
    throw error(404, 'Error loading appLabels or election');
  }
  return {
    appLabels,
    election,
    // We'll initialize as empty Arrays because they are required by `PageData`.
    // See `app.d.ts` for more details
    candidates: [],
    parties: [],
    questions: []
  };
}) satisfies LayoutServerLoad;
