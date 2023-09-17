import type {LayoutServerLoad} from './$types';
import {getAppLabels, getElection} from '$lib/api/getData';

export const load = (async () => {
  return {
    appLabels: await getAppLabels(),
    election: await getElection(),
    // We'll initialize as empty Arrays because they are required by `PageData`.
    // See `app.d.ts` for more details
    candidates: [],
    parties: [],
    questions: []
  };
}) satisfies LayoutServerLoad;
