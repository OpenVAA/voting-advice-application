import type {LayoutServerLoad} from './$types';
import {getOpinionQuestions} from '$lib/api/getData';

export const load = (async () => {
  return {
    questions: await getOpinionQuestions()
  };
}) satisfies LayoutServerLoad;
