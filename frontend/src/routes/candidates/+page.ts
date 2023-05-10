import {getAllCandidates} from '../../api/getData';
import type {LoadEvent} from '@sveltejs/kit';

export async function load({fetch}: LoadEvent) {
  const candidates = await getAllCandidates(fetch);
  return {candidates};
}
