import { translateVideoContent } from '$lib/api/utils/translateVideoContent';
import type { CustomData } from '@openvaa/app-shared';
import type { StrapiQuestionCategoryCustomData } from '../strapiData.type';

/**
 * Parse (localized) properties in QuestionCategory customData.
 */
export function parseQuestionCategoryCustomData(
  data: StrapiQuestionCategoryCustomData | null | undefined,
  locale: string | null
): CustomData['QuestionCategory'] {
  if (!data || typeof data !== 'object') return {};
  const { video, ...rest } = data;
  return {
    video: video && translateVideoContent(video, locale),
    ...rest
  };
}
