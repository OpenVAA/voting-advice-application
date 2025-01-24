import { type AnyQuestionVariantData, type Choice, QUESTION_TYPE } from '@openvaa/data';
import { formatId } from '$lib/api/utils/formatId';
import { translate } from '$lib/i18n';
import type { LocalizedChoice, QuestionSettingsDateType } from '@openvaa/app-shared';
import type { StrapiQuestionTypeData } from '../strapiData.type';

export function parseQuestionType(
  data: StrapiQuestionTypeData,
  locale: string | null
): Partial<AnyQuestionVariantData> {
  const s = data.settings;
  const { type } = s;
  switch (type) {
    case 'text':
      return {
        type,
        customData: { notLocalizable: s.notLocalizable }
      };
    case 'number':
      return {
        type,
        max: s.max,
        min: s.min
      };
    case 'boolean':
      return {
        type
      };
    case 'date':
      return {
        type,
        format: s.dateType ? DATE_FORMATS[s.dateType] : undefined,
        max: s.max,
        min: s.min
      };
    case 'link':
      return {
        type: QUESTION_TYPE.Text,
        subtype: 'link'
      };
    case 'singleChoiceOrdinal':
      return {
        type,
        choices: parseOrdinalChoices(s.choices, locale),
        customData: { display: s.display }
      };
    case 'singleChoiceCategorical':
      return {
        type,
        choices: parseCategoricalChoices(s.choices, locale),
        customData: { display: s.display }
      };
    case 'multipleChoiceCategorical':
      return {
        type,
        choices: parseCategoricalChoices(s.choices, locale),
        customData: { display: s.display }
      };
    default:
      throw new Error(`Unsupported question type: ${type}`);
  }
}

/**
 * The date formats passed to `new Date().toLocaleDateString()` when displaying dates.
 */
const DATE_FORMATS: Record<QuestionSettingsDateType, Intl.DateTimeFormatOptions> = {
  yearMonthDay: {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  },
  yearMonth: {
    year: 'numeric',
    month: 'long'
  },
  monthDay: {
    month: 'long',
    day: 'numeric'
  },
  month: {
    month: 'long'
  },
  weekday: {
    weekday: 'long'
  }
};

function parseCategoricalChoices(choices: Array<LocalizedChoice>, locale?: string | null): Array<Choice> {
  return choices.map(({ id, label, ...rest }) => ({
    id: formatId(id),
    label: translate(label, locale),
    ...rest
  }));
}

function parseOrdinalChoices(choices: Array<LocalizedChoice>, locale?: string | null): Array<Choice<number>> {
  return choices.map(({ id, label, normalizableValue, ...rest }) => {
    if (normalizableValue == null)
      throw new Error(`Missing 'normalizableValue' in ordinal choice ${id} • ${translate(label, locale)}`);
    return {
      id: formatId(id),
      label: translate(label, locale),
      normalizableValue,
      ...rest
    };
  });
}
