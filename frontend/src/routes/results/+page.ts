import {getAllCandidates} from '../../api/getData';

export async function load() {
  const results = await getAllCandidates();
  return {results: results};
}
