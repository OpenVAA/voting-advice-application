import type { TranslationKey } from '$types';

/**
 * Get the translation key for the error code.
 */
export function getErrorTranslationKey(code: CandidatePreregistrationError | string | null): {
  title: TranslationKey;
  content: TranslationKey;
} {
  return typeof code === 'string' && code in CANDIDATE_PREREGISTRATION_ERROR
    ? CANDIDATE_PREREGISTRATION_ERROR[code]
    : CANDIDATE_PREREGISTRATION_ERROR['unknownError'];
}

const CANDIDATE_PREREGISTRATION_ERROR: Record<string, { title: TranslationKey; content: TranslationKey }> = {
  strongIdentificationError: {
    title: 'candidateApp.preregister.status.strongIdentificationError.title',
    content: 'candidateApp.preregister.status.strongIdentificationError.content'
  },
  tokenExpiredError: {
    title: 'candidateApp.preregister.status.tokenExpiredError.title',
    content: 'candidateApp.preregister.status.tokenExpiredError.content'
  },
  candidateExistsError: {
    title: 'candidateApp.preregister.status.candidateExistsError.title',
    content: 'candidateApp.preregister.status.candidateExistsError.content'
  },
  unknownError: {
    title: 'candidateApp.preregister.status.unknownError.title',
    content: 'candidateApp.preregister.status.unknownError.content'
  }
} as const;

/**
 * The allowed error codes for candidate preregistration to be displayed on the preregistration page.
 */
export type CandidatePreregistrationError = keyof typeof CANDIDATE_PREREGISTRATION_ERROR;
