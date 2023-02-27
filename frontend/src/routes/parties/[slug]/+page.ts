import {getData} from '../../../api/getData';
import {error} from '@sveltejs/kit';
import type {LoadEvent} from '@sveltejs/kit';

export async function load({params}: LoadEvent) {
  //TODO: Check if we use Svelte object id or some predefined schema for getting party from the backend
  const id = Number(params.slug);
  if (!isNaN(id)) {
    return await getData(`api/parties/${id}?populate=*`).then((result) => {
      if (result?.data?.attributes) return result.data.attributes;
      if (result?.error?.status === 404) {
        throw error(404, 'Party not found');
      }
    });
  } else {
    throw error(404, 'Party not found');
  }
}
