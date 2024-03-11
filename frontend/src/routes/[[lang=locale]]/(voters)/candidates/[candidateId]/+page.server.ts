import {getNominatedCandidates} from '$lib/api/getData';
import {error} from '@sveltejs/kit';
import type {PageServerLoad} from './$types';

export const load = (async ({parent, params}) => {
  const locale = (await parent()).i18n.currentLocale;
  const id = params.candidateId;
  const results = await getNominatedCandidates({id, loadAnswers: true, locale});
  if (results.length === 0) {
    throw error(404, 'Candidate not found');
  }
  return {
    candidate: results[0]
  };
}) satisfies PageServerLoad;
