import {getData} from '../../api/getData';
import type {LoadEvent} from '@sveltejs/kit';

export async function load({fetch}: LoadEvent) {
  const parties = await getData('parties', fetch).then((result) => {
    return result?.data;
  });
  return {parties: parties};
}
