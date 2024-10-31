import {
  ChoiceQuestion,
  type ChoiceQuestionData,
  type Id,
  type MissingValue,
  type SingleChoiceQuestionType
} from '../../../internal';

/**
 * An abstract base class for all questions which allow choosing a single enumerated answering choice.
 */
export abstract class SingleChoiceQuestion<
  // We need to unelegantly provide `TType` and `TValue` twice because inferring then from `TData` leads to typing issues
  TType extends SingleChoiceQuestionType,
  TValue = undefined,
  TData extends ChoiceQuestionData<TType, TValue> = ChoiceQuestionData<TType, TValue>
> extends ChoiceQuestion<TType, TValue, TData> {
  protected _ensureValue(value: NonNullable<unknown>): Id | MissingValue {
    return this._ensureChoice(value);
  }
}
