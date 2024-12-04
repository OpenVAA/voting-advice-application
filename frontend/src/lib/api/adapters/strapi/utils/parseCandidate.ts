import { type CandidateData, ENTITY_TYPE } from '@openvaa/data';
import { formatId } from '$lib/api/utils/formatId';
import { parseAnswers } from './parseAnswers';
import { parseImage } from './parseImage';
import type { StrapiCandidateData } from '../strapiData.type';

export function parseCandidate(data: StrapiCandidateData, locale: string | null): CandidateData {
  const { answers, firstName, lastName, photo } = data.attributes;
  const id = formatId(data.id);
  return {
    type: ENTITY_TYPE.Candidate,
    id,
    firstName,
    lastName,
    image: parseImage(photo),
    answers: parseAnswers(answers, locale)
  };
}
