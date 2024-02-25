import {getInfoQuestions, getNominatedCandidates, getOpinionQuestions} from '$lib/api/getData';
import type {LayoutServerLoad} from './$types';

export const load = (async () => {
  return {
    candidates: await getNominatedCandidates({loadAnswers: true}),
    // We need these for displaying the candidates
    questions: await getOpinionQuestions(),
    infoQuestions: await getInfoQuestions()
  };
}) satisfies LayoutServerLoad;
