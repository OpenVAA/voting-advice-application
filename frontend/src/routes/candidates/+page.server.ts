import {getAllCandidates} from '../../api/getData';

export async function load() {
  const candidates = await getAllCandidates();
  return {candidates};
}
