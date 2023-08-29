import type {LayoutServerLoad} from './$types';
import {getAllQuestions} from '$lib/api/getData';

export const load = (async () => {
  return {
    questions: await getAllQuestions()
  };
}) satisfies LayoutServerLoad;
