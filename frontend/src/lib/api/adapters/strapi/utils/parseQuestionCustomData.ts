import { translateHeroContent } from '$lib/api/utils/translateHeroContent';
import { translateQuestionArguments } from '$lib/api/utils/translateQuestionArguments';
import { translateQuestionInfoSections } from '$lib/api/utils/translateQuestionInfoSections';
import { translateQuestionTerms } from '$lib/api/utils/translateQuestionTerms';
import { translateVideoContent } from '$lib/api/utils/translateVideoContent';
import type { CustomData } from '@openvaa/app-shared';
import type { StrapiQuestionCustomData } from '../strapiData.type';

/**
 * Parse (localized) properties in Question customData.
 */
export function parseQuestionCustomData(
  data: StrapiQuestionCustomData | null | undefined,
  locale: string | null
): CustomData['Question'] {
  if (!data || typeof data !== 'object') return {};
  const { arguments: args, infoSections, terms, video, hero, ...rest } = data;
  return {
    arguments: args ? translateQuestionArguments(args, locale) : undefined,
    hero: hero ? translateHeroContent(hero, locale) : undefined,
    infoSections: infoSections ? translateQuestionInfoSections(infoSections, locale) : undefined,
    terms: terms ? translateQuestionTerms(terms, locale) : undefined,
    video: video ? translateVideoContent(video, locale) : undefined,
    ...rest
  };
}
