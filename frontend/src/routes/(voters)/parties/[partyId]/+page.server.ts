import {getNominatedCandidates} from '$lib/api/getData';
import {error} from '@sveltejs/kit';
import type {ServerLoadEvent} from '@sveltejs/kit';
import type {PageServerLoad} from './$types';

export const load = (async ({params, parent}: ServerLoadEvent) => {
  //TODO: Check if we use Svelte object id or some predefined schema for getting party from the backend
  const id = params.partyId;
  if (id == null || id === '') {
    throw error(404, 'Party not found (invalid id)');
  }
  const candidates = await getNominatedCandidates({nominatingPartyId: id});
  const {parties} = await parent();
  const party = (parties as PartyProps[]).find((p) => p.id === id);
  if (!party) {
    throw error(404, 'Party not found');
  }
  party.nominatedCandidates = candidates;
  return {party};
}) satisfies PageServerLoad;
