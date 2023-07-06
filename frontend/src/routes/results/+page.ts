import {getAllCandidates} from '../../api/getData';
import type {PageLoad} from './$types';

export const load = (async ({fetch, params, url, route}) => {
  const results = await getAllCandidates({fetch});
  return {results: results};
}) satisfies PageLoad;
