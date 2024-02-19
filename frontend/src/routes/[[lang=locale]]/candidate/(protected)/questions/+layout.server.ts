import type {LayoutServerLoad} from '$types';
import {getQuestions} from '$lib/api/getData';

export const load = (async () => {
  return {
    questions: await getQuestions()
  };
}) satisfies LayoutServerLoad;
