import { type CandidateData, ENTITY_TYPE } from '@openvaa/data';
import { formatId } from '$lib/api/utils/formatId';
import { parseAnswers } from '$lib/api/utils/parseAnswers';
import { parseImage } from './parseImage';
import type { LocalizedAnswers, LocalizedCandidateData } from '$lib/api/base/dataWriter.type';
import type { StrapiCandidateData, StrapiUpdateCandidateReturnData } from '../strapiData.type';

/**
 * Parse a Strapi Candidate data into a `CandidateData` or `LocalizedCandidateData` object.
 * @param param0 - The Strapi data
 * @param locale - The locale to translate into
 * @param dontTranslateAnswers - If `true`, answers will not be translated. Used by the Candidate App.
 */
export function parseCandidate<TLocalized extends boolean | undefined>(
  {
    documentId,
    answers,
    firstName,
    lastName,
    image,
    termsOfUseAccepted
  }: StrapiCandidateData | StrapiUpdateCandidateReturnData,
  locale: string | null,
  {
    dontTranslateAnswers
  }: {
    dontTranslateAnswers?: TLocalized;
  } = {}
): TLocalized extends true ? LocalizedCandidateData : CandidateData {
  const id = formatId(documentId);
  return {
    type: ENTITY_TYPE.Candidate,
    id,
    firstName,
    lastName,
    image: parseImage(image),
    answers: dontTranslateAnswers ? (answers as LocalizedAnswers) : parseAnswers(answers, locale),
    termsOfUseAccepted
  } as TLocalized extends true ? LocalizedCandidateData : CandidateData;
}
