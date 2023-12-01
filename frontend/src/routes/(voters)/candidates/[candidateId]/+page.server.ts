import {getNominatedCandidates, getQuestions} from '$lib/api/getData';
import {error} from '@sveltejs/kit';
import type {PageServerLoad} from './$types';

export const load = (async ({params}) => {
  const id = params.candidateId;
  const results = await getNominatedCandidates({id, loadAnswers: true});
  if (results.length === 0) {
    throw error(404, 'Candidate not found');
  }
  const questions = await getQuestions();
  if (questions.length === 0) {
    throw error(404, 'Questions not found');
  }
  return {
    candidate: results[0],
    questions
  };
}) satisfies PageServerLoad;
