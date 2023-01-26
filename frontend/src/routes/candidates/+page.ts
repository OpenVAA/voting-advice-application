import {getAllCandidates} from '../../api/getData';

export async function load() {
  // TODO: Define proper candidate data structure
  return await getAllCandidates();
}
