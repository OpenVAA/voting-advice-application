import { ENTITY_TYPE, type OrganizationData } from '@openvaa/data';
import { parseAnswers } from '$lib/api/adapters/strapi/utils/parseAnswers';
import { parseBasics } from './parseBasics';
import { parseImage } from './parseImage';
import type { StrapiPartyData } from '../strapiData.type';

export function parseOrganization(data: StrapiPartyData, locale: string | null): OrganizationData {
  const { answers, color, colorDark, image } = data;
  return {
    type: ENTITY_TYPE.Organization,
    ...parseBasics(data, locale),
    color: color ? { normal: color, dark: colorDark || undefined } : undefined,
    image: parseImage(image),
    answers: parseAnswers(answers, locale)
  };
}
