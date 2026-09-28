import type { TranslationKey } from '$types';

/**
 * Get the translation key for the given error code.
 */
export function getErrorTranslationKey(error: CandidateLoginError | null): TranslationKey | undefined {
  if (error == null || !(error in CANDIDATE_LOGIN_ERROR)) return undefined;
  return CANDIDATE_LOGIN_ERROR[error];
}

const CANDIDATE_LOGIN_ERROR: Record<CandidateLoginError, TranslationKey> = {
  candidateNoNomination: 'candidateApp.error.candidateNoNomination',
  loginFailed: 'error.loginFailed',
  nominationNoElection: 'candidateApp.error.nominationNoElection',
  userNoCandidate: 'candidateApp.error.userNoCandidate',
  userNotAuthorized: 'error.403'
} as const;

/**
 * The allowed error codes for candidate login to be displayed on the login page. These are subkeys of `candidateApp.error.` translations.
 */
export type CandidateLoginError =
  | 'candidateNoNomination'
  | 'loginFailed'
  | 'nominationNoElection'
  | 'userNoCandidate'
  | 'userNotAuthorized';
