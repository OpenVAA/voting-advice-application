import { ENTITY_TYPE, type OrganizationData } from '@openvaa/data';
import { ensureColors } from '$lib/utils/color/ensureColors';
import { parseAnswers } from './parseAnswers';
import { parseBasics } from './parseBasics';
import { parseImage } from './parseImage';
import type { StrapiPartyData } from '../strapiData.type';

export function parseOrganization(data: StrapiPartyData, locale: string | null): OrganizationData {
  const { answers, color, colorDark, logo } = data.attributes;
  return {
    type: ENTITY_TYPE.Organization,
    ...parseBasics(data, locale),
    color: ensureColors({ normal: color, dark: colorDark }),
    image: parseImage(logo),
    answers: parseAnswers(answers, locale)
  };
}
