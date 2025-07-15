import { type AnyQuestionVariant, QUESTION_TYPE } from '@openvaa/data';
import { ChoiceQuestionFilter, NumberQuestionFilter, TextQuestionFilter } from '@openvaa/filters';
import { logDebugError } from '$lib/utils/logger';
import type { Filter } from '@openvaa/filters';

/**
 * Create a filter for the given `Question`.
 * @param question - Any filterable `Question`.
 * @param locale - The locale used for sorting values.
 * @returns A filter for the given `Question` or `undefined` if the `Question` type is not supported.
 */
export function buildQuestionFilter({
  question,
  locale
}: {
  question: AnyQuestionVariant;
  locale: string;
}): Filter<MaybeWrappedEntityVariant, unknown> | undefined {
  switch (question.type) {
    case QUESTION_TYPE.SingleChoiceCategorical:
    case QUESTION_TYPE.SingleChoiceOrdinal:
    case QUESTION_TYPE.MultipleChoiceCategorical:
      return new ChoiceQuestionFilter<MaybeWrappedEntityVariant>(
        {
          question,
          name: question.text
        },
        locale
      );
    case QUESTION_TYPE.Number:
      return new NumberQuestionFilter<MaybeWrappedEntityVariant>({
        question,
        name: question.text
      });
    case QUESTION_TYPE.Text:
    case QUESTION_TYPE.MultipleText:
      return new TextQuestionFilter<MaybeWrappedEntityVariant>(
        {
          question,
          name: question.text
        },
        locale
      );
    default:
      logDebugError(`No filters supported for question type: ${question.type}`);
  }
  return undefined;
}
