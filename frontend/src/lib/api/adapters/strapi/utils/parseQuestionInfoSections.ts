import { type AnyQuestionVariantData, type Choice, QUESTION_TYPE } from '@openvaa/data';
import { formatId } from '$lib/api/utils/formatId';
import { translate } from '$lib/i18n/utils';
import type { StrapiChoice, StrapiDateType, StrapiQuestionData, StrapiQuestionTypeData } from '../strapiData.type';

export function parseQuestionInfoSections(
  data: StrapiQuestionData['attributes']['customData'],
  locale: string | null
): QuestionInfoSections {
  const out: QuestionInfoSections = {};

  for (const [key, value] of Object.entries((data as any)?.infoSections ?? {})) {
    const { title, text, visible } = value as {
      text?: LocalizedString;
      title?: LocalizedString;
      visible?: boolean;
    };

    out[key] = {
      title: translate(title, locale) || '',
      text: translate(text, locale) || '',
      visible: Boolean(visible) ?? false
    };
  }

  return out;
}
