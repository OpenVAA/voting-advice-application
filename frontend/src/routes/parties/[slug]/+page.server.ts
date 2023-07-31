import {getData} from '../../../api/getData';
import {error} from '@sveltejs/kit';
import type {ServerLoadEvent} from '@sveltejs/kit';
import type {PageServerLoad} from './$types';

export const load = (async ({params}: ServerLoadEvent) => {
  //TODO: Check if we use Svelte object id or some predefined schema for getting party from the backend
  const id = Number(params.slug);
  if (!isNaN(id)) {
    const partyData = await getData(`api/parties/${id}`).then((result) => {
      if (result?.data?.attributes) return result.data.attributes;
      if (result?.error?.status === 404) {
        throw error(404, 'Party not found');
      }
    });

    const candidates = await getData(
      'api/candidates',
      new URLSearchParams({
        'filters[party][id]': id.toString()
      })
    ).then((result) => {
      if (result?.data) {
        return result.data;
      } else {
        console.error('No candidates found');
      }
    });

    const party = {
      ...partyData,
      candidates
    };
    return party;
  } else {
    throw error(404, 'Party not found');
  }
}) satisfies PageServerLoad;
