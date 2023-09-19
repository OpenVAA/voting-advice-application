import {getNominatedCandidates, getQuestions} from '$lib/api/getData';
import type {LayoutServerLoad} from './$types';

export const load = (async () => {
  return {
    candidates: await getNominatedCandidates({loadAnswers: true}),
    // We need to make sure we have the questions, bc if the page is reloaded
    // we'll have lost the question data store
    questions: await getQuestions()
  };
}) satisfies LayoutServerLoad;
