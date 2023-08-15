import {getData} from '../../lib/vaa-data/_getData';
import type {PageServerLoad} from './$types';

export const load = (async () => {
  const parties = await getData('api/parties').then((result) => {
    return result?.data;
  });
  return {parties: parties};
}) satisfies PageServerLoad;
