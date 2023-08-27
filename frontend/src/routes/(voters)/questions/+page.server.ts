import type {PageServerLoad} from './$types';
import {getAllQuestions} from '$lib/api/getData';

export const load = (async () => {
  return {
    questions: await getAllQuestions() // getAllQuestions(),
  };
}) satisfies PageServerLoad;
