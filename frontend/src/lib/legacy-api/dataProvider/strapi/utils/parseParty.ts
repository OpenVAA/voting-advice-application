import { translate } from '$lib/i18n/utils/translate';
import { legacyEnsureColors } from './legacyEnsureColors';
import { parseAnswers } from './parseAnswers';
import { parseImage } from './parseImage';
import type { StrapiPartyData } from '../strapiDataProvider.type';

/**
 * Parse Strapi Party data into a `LegacyPartyProps` object.
 */
export function parseParty(
  party: StrapiPartyData,
  locale?: string,
  includeAnswers = false,
  includeMembers = false
): LegacyPartyProps {
  const id = `${party.id}`;
  const attr = party.attributes;
  const name = translate(attr.name, locale);
  const shortName = translate(attr.shortName, locale);
  const props: LegacyPartyProps = {
    electionRound: 0, // We use a default here
    id,
    info: translate(attr.info, locale),
    name,
    shortName: shortName ? shortName : name,
    ...legacyEnsureColors(attr.color, attr.colorDark),
    answers: includeAnswers && attr.answers?.data ? parseAnswers(attr.answers.data, locale) : {}
  };
  const photo = attr.logo?.data?.attributes;
  if (photo) props.photo = parseImage(photo);
  if (includeMembers) props.memberCandidateIds = attr.candidates.data.map((c) => `${c.id}`);
  return props;
}
