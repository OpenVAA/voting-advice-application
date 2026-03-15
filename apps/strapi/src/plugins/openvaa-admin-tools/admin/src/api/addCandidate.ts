import { apiPost } from './utils/apiPost';
import type {
  AddCandidateResult,
  FormOptionsResult,
} from '../../../server/src/services/addCandidate.type';

export async function getFormOptions(): Promise<FormOptionsResult> {
  const response = await apiPost('/openvaa-admin-tools/add-candidate/form-options', {}).catch(
    (e) => e
  );
  return parseResponse(response, 'There was an error fetching form options');
}

export async function addCandidate({
  firstName,
  lastName,
  email,
  partyExternalId,
  constituencyExternalId,
}: {
  firstName: string;
  lastName: string;
  email: string;
  partyExternalId: string;
  constituencyExternalId: string;
}): Promise<AddCandidateResult> {
  const response = await apiPost('/openvaa-admin-tools/add-candidate/submit', {
    firstName,
    lastName,
    email,
    partyExternalId,
    constituencyExternalId,
  }).catch((e) => e);
  return parseResponse(response, 'There was an error adding the candidate');
}

async function parseResponse<TResult extends { type: string; cause?: string }>(
  response: Response | Error,
  fallbackError: string
): Promise<TResult> {
  if (response instanceof Error) {
    return { type: 'failure', cause: response.message } as TResult;
  }
  if (!response.ok) {
    return { type: 'failure', cause: fallbackError } as TResult;
  }
  const data: TResult = await response.json();
  if (data.type !== 'success') {
    return { type: 'failure', cause: data.cause ?? fallbackError } as TResult;
  }
  return data;
}
