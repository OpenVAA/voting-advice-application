import {getAllCandidates} from '../../lib/api/_getData';
import type {PageServerLoad} from './$types';

export const load = (async () => {
  const results = await getAllCandidates();
  return {results: results};
}) satisfies PageServerLoad;
