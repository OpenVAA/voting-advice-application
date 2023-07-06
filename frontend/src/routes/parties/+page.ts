import {getData} from '../../api/getData';
import type {PageLoad} from './$types';

export const load = (async ({fetch}) => {
  const parties = await getData({fetch, endpoint: 'api/parties'}).then((result) => {
    return result?.data;
  });
  return {parties: parties};
}) satisfies PageLoad;
