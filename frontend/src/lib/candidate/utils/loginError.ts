import type { TranslationKey } from '$types';

/**
 * Get the translation key for the given error code.
 */
export function getErrorTranslationKey(error: CandidateLoginError | string | null): TranslationKey | undefined {
  if (error == null || !(error in CANDIDATE_LOGIN_ERROR)) return undefined;
  return CANDIDATE_LOGIN_ERROR[error];
}

const CANDIDATE_LOGIN_ERROR: Record<string, TranslationKey> = {
  candidateNoNomination: 'candidateApp.error.candidateNoNomination',
  loginFailed: 'candidateApp.error.loginFailed',
  nominationNoElection: 'candidateApp.error.nominationNoElection',
  userNoCandidate: 'candidateApp.error.userNoCandidate'
} as const;

/**
 * The allowed error codes for candidate login to be displayed on the login page. These are subkeys of `candidateApp.error.` translations.
 */
export type CandidateLoginError = keyof typeof CANDIDATE_LOGIN_ERROR;
