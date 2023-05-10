import {getAllCandidates} from '../../api/getData';
import type {LoadEvent} from '@sveltejs/kit';

export async function load({fetch}: LoadEvent) {
  const results = await getAllCandidates(fetch);
  return {results: results};
}
