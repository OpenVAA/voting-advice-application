import { parseAnswers } from '../adapters/strapi/utils/parseAnswers';
import type { CandidateData } from '@openvaa/data';
import type { LocalizedCandidateData } from '../base/dataWriter.type';

/**
 * Translate a localized candidate data object into a `CandidateData` object. Used when displaying a preview of the candidate in the Candidate App.
 */
export function translateLocalizedCandidate(candidate: LocalizedCandidateData, locale: string | null): CandidateData {
  return {
    ...structuredClone(candidate),
    answers: parseAnswers(candidate.answers, locale)
  };
}
