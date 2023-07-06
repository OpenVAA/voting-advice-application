import {getData} from '../../../api/getData';
import {error} from '@sveltejs/kit';
import type {LoadEvent} from '@sveltejs/kit';

export async function load({route, url, fetch, params}: LoadEvent) {
  //TODO: Check if we use Svelte object id or some predefined schema for getting candidate from the backend
  const id = Number(params.slug);
  if (!isNaN(id)) {
    const candidates = await getData({fetch, endpoint: `api/candidates/${id}`}).then((result) => {
      if (result?.data?.attributes) return result.data.attributes;
      if (result?.error?.status === 404) {
        throw error(404, 'Candidate not found');
      }
    });
    const themes = await getData({fetch, endpoint: 'api/categories'}).then((result) => {
      if (result?.data) return result.data;
      if (result?.error?.status === 404) {
        throw error(404, 'Themes not found');
      }
    });
    candidates.themes = themes;
    return candidates;
  } else {
    throw error(404, 'There is some error fetching candidates or themes');
  }
}
