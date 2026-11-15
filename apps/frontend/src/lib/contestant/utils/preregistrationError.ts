import type { TranslationKey } from '$types';

/**
 * Get the translation key for the error code.
 */
export function getErrorTranslationKey(code: ContestantPreregistrationError | string | null): {
  title: TranslationKey;
  content: TranslationKey;
} {
  return typeof code === 'string' && code in CONTESTANT_PREREGISTRATION_ERROR
    ? CONTESTANT_PREREGISTRATION_ERROR[code]
    : CONTESTANT_PREREGISTRATION_ERROR['unknownError'];
}

const CONTESTANT_PREREGISTRATION_ERROR: Record<string, { title: TranslationKey; content: TranslationKey }> = {
  strongIdentificationError: {
    title: 'contestantApp.preregister.status.strongIdentificationError.title',
    content: 'contestantApp.preregister.status.strongIdentificationError.content'
  },
  tokenExpiredError: {
    title: 'contestantApp.preregister.status.tokenExpiredError.title',
    content: 'contestantApp.preregister.status.tokenExpiredError.content'
  },
  candidateExistsError: {
    title: 'contestantApp.preregister.status.candidateExistsError.title',
    content: 'contestantApp.preregister.status.candidateExistsError.content'
  },
  unknownError: {
    title: 'contestantApp.preregister.status.unknownError.title',
    content: 'contestantApp.preregister.status.unknownError.content'
  }
} as const;

/**
 * The allowed error codes for candidate preregistration to be displayed on the preregistration page.
 */
export type ContestantPreregistrationError = keyof typeof CONTESTANT_PREREGISTRATION_ERROR;
