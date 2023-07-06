import {getAllCandidates} from '../../api/getData';
import type {PageLoad} from './$types';

export const load = (async ({fetch}) => {
  const candidates = await getAllCandidates({fetch});
  return {candidates};
}) satisfies PageLoad;
