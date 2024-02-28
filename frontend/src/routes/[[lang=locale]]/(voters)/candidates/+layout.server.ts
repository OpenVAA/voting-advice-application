import {getOpinionQuestions, getInfoQuestions} from '$lib/api/getData';
import type {LayoutServerLoad} from './$types';

export const load = (async () => {
  return {
    // We need these for displaying the candidates
    questions: await getOpinionQuestions(),
    infoQuestions: await getInfoQuestions()
  };
}) satisfies LayoutServerLoad;
