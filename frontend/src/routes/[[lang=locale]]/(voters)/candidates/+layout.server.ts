import {getQuestions} from '$lib/api/getData';
import type {LayoutServerLoad} from './$types';

export const load = (async () => {
  return {
    // We need these for displaying the candidates
    questions: await getQuestions()
  };
}) satisfies LayoutServerLoad;
