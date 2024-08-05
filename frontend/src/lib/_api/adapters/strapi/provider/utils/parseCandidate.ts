import type {GetDataOptions} from '$lib/_api/dataProvider.type';
import {formatId} from '$lib/_api/utils/formatId';
import type {CandidateData} from '$lib/_vaa-data';
import type {StrapiCandidateData} from '../../strapiData.type';
import {parseAnswers} from './parseAnswers';
import {parseImage} from './parseImage';

export function parseCandidate(
  data: StrapiCandidateData,
  {locale, loadAnswers}: Pick<GetDataOptions['candidates'], 'locale' | 'loadAnswers'>
): CandidateData {
  const attr = data.attributes;
  const id = formatId(data.id);
  const {firstName, lastName} = attr;
  console.error((locale ?? '') + firstName);
  const candidate: CandidateData = {
    id,
    // TODO: Remove this debug thingie
    firstName: (locale ?? '') + firstName,
    lastName,
    answers: loadAnswers && attr.answers?.data ? parseAnswers(attr.answers.data, locale) : {}
  };
  const photo = attr.photo?.data?.attributes;
  if (photo) candidate.image = parseImage(photo);
  return candidate;
}
