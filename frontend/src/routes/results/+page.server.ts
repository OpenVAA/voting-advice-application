import {getAllCandidates, getAllQuestions} from '$lib/api/getData';
import type {PageServerLoad} from './$types';

export const load = (async () => {
  return {
    candidates: await getAllCandidates(),
    // We need to make sure we have the questions, bc if the page is reloaded
    // we'll have lost the question data store
    questions: await getAllQuestions()
  };
}) satisfies PageServerLoad;
