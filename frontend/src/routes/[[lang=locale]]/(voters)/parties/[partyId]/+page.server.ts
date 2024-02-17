import {getNominatedCandidates, getNominatingParties} from '$lib/api/getData';
import {error} from '@sveltejs/kit';
import type {PageServerLoad} from './$types';

export const load = (async ({params}) => {
  const id = params.partyId;
  if (!id) {
    throw error(404, 'Invalid party id');
  }
  const candidates = await getNominatedCandidates({nominatingPartyId: id});
  const results = await getNominatingParties({id, loadAnswers: true});
  if (results.length === 0) {
    throw error(404, 'Party not found');
  }
  const party = results[0];
  party.nominatedCandidates = candidates;
  return {party};
}) satisfies PageServerLoad;
