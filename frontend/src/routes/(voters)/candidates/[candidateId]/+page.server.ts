import {getNominatedCandidates} from '$lib/api/getData';
import type {PageServerLoad} from './$types';

export const load = (async ({params}) => {
  const id = params.candidateId;
  const results = await getNominatedCandidates({id, loadAnswers: true});
  return {
    candidate: results?.length > 0 ? results[0] : undefined
  };
}) satisfies PageServerLoad;
