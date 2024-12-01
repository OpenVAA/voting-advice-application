import { translate } from '$lib/i18n/utils/translate';
import { parseCustomData } from './parseCustomData';
import { ensureColors } from '../../../../utils/color/ensureColors';
import type { StrapiQuestionCategoryData } from '../strapiDataProvider.type';

/**
 * Parse StrapiQuestionCategory data into a `LegacyQuestionCategoryProps` object, which must be supplied with the actual `questions` later.
 */
export function parseQuestionCategory(
  category: StrapiQuestionCategoryData,
  locale?: string
): LegacyQuestionCategoryProps {
  const id = `${category.id}`;
  const attr = category.attributes;
  const name = translate(attr.name, locale);
  const shortName = translate(attr.shortName, locale);
  const props: LegacyQuestionCategoryProps = {
    id,
    order: attr.order ?? 0,
    type: attr.type,
    info: translate(attr.info, locale),
    name,
    shortName: shortName ? shortName : name,
    ...ensureColors(attr.color, attr.colorDark),
    customData: parseCustomData(attr.customData),
    questions: []
  };
  return props;
}
