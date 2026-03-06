import { apiPost } from './utils/apiPost';
import type { CandidateStatsResult } from '../../../server/src/services/candidateStats.type';

export async function getCandidateStats(): Promise<CandidateStatsResult> {
  const response = await apiPost('/openvaa-admin-tools/candidate-statistics', {}).catch((e) => e);
  return parseResponse(response, 'There was an error fetching candidate statistics');
}

async function parseResponse(
  response: Response | Error,
  fallbackError: string
): Promise<CandidateStatsResult> {
  if (response instanceof Error) {
    return { type: 'failure', cause: response.message };
  }
  if (!response.ok) {
    return { type: 'failure', cause: fallbackError };
  }
  const data: CandidateStatsResult = await response.json();
  if (data.type !== 'success') {
    return { type: 'failure', cause: data.cause ?? fallbackError };
  }
  return data;
}
