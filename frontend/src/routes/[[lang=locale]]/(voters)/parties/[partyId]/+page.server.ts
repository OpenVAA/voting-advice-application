import {getNominatedCandidates, getNominatingParties} from '$lib/api/getData';
import {error} from '@sveltejs/kit';
import type {PageServerLoad} from './$types';

export const load = (async ({params, parent}) => {
  const locale = (await parent()).i18n.currentLocale;
  const id = params.partyId;
  if (!id) {
    throw error(404, 'Invalid party id');
  }
  const candidates = await getNominatedCandidates({nominatingPartyId: id, locale});
  const results = await getNominatingParties({id, loadAnswers: true, locale});
  if (results.length === 0) {
    throw error(404, 'Party not found');
  }
  const party = results[0];
  party.nominatedCandidates = candidates;
  return {party};
}) satisfies PageServerLoad;
