import { translate } from '$lib/i18n/utils/translate';
import { ensureColors } from '../../../../utils/color/ensureColors';
import type { StrapiQuestionCategoryData } from '../strapiDataProvider.type';
import { parseCustomData } from './parseCustomData';

/**
 * Parse StrapiQuestionCategory data into a `QuestionCategoryProps` object, which must be supplied with the actual `questions` later.
 */
export const parseQuestionCategory = (
  category: StrapiQuestionCategoryData,
  locale?: string
): QuestionCategoryProps => {
  const id = `${category.id}`;
  const attr = category.attributes;
  const name = translate(attr.name, locale);
  const shortName = translate(attr.shortName, locale);
  const props: QuestionCategoryProps = {
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
};
