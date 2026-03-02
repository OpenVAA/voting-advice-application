import { apiPost } from './utils/apiPost';
import type { CandidateAuthActionResult } from '../../../server/src/services/candidateAuth.type';

export async function searchCandidates({
  query,
}: {
  query: string;
}): Promise<CandidateAuthActionResult> {
  const response = await apiPost('/openvaa-admin-tools/candidate-auth/search', { query }).catch(
    (e) => e
  );
  return parseResponse(response, 'There was an error searching candidates');
}

export async function getCandidateInfo({
  documentId,
}: {
  documentId: string;
}): Promise<CandidateAuthActionResult> {
  const response = await apiPost('/openvaa-admin-tools/candidate-auth/info', { documentId }).catch(
    (e) => e
  );
  return parseResponse(response, 'There was an error fetching candidate info');
}

export async function forceRegisterCandidate({
  documentId,
  password,
}: {
  documentId: string;
  password: string;
}): Promise<CandidateAuthActionResult> {
  const response = await apiPost('/openvaa-admin-tools/candidate-auth/force-register', {
    documentId,
    password,
  }).catch((e) => e);
  return parseResponse(response, 'There was an error force-registering the candidate');
}

export async function sendForgotPassword({
  documentId,
}: {
  documentId: string;
}): Promise<CandidateAuthActionResult> {
  const response = await apiPost('/openvaa-admin-tools/candidate-auth/forgot-password', {
    documentId,
  }).catch((e) => e);
  return parseResponse(response, 'There was an error sending the forgot password email');
}

export async function setCandidatePassword({
  documentId,
  password,
}: {
  documentId: string;
  password: string;
}): Promise<CandidateAuthActionResult> {
  const response = await apiPost('/openvaa-admin-tools/candidate-auth/set-password', {
    documentId,
    password,
  }).catch((e) => e);
  return parseResponse(response, 'There was an error setting the password');
}

export async function generateCandidatePassword({
  username,
}: {
  username: string;
}): Promise<CandidateAuthActionResult> {
  const response = await apiPost('/openvaa-admin-tools/candidate-auth/generate-password', {
    username,
  }).catch((e) => e);
  return parseResponse(response, 'There was an error generating the password');
}

async function parseResponse(
  response: Response | Error,
  fallbackError: string
): Promise<CandidateAuthActionResult> {
  if (response instanceof Error) {
    return { type: 'failure', cause: response.message };
  }
  if (!response.ok) {
    return { type: 'failure', cause: fallbackError };
  }
  const data: CandidateAuthActionResult = await response.json();
  if (data.type !== 'success') {
    return { type: 'failure', cause: data.cause ?? fallbackError };
  }
  return data;
}
