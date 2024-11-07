import {
  type Choice,
  ChoiceQuestion,
  type DataAccessor,
  ensureArray,
  ensureUnique,
  type Id,
  isMissingValue,
  type MultipleChoiceQuestionData,
  type MultipleChoiceQuestionType,
  removeDuplicates
} from '../../../internal';

/**
 * An abstract base class for all questions which allow choosing multiple enumerated answering choices.
 * NB. If the value array passed to `MultipleChoiceQuestion.normalizeValue` contains any missing values, the whole array is treated as missing.
 */
export abstract class MultipleChoiceQuestion<
    // We need to unelegantly provide `TType` and `TValue` twice because inferring then from `TData` leads to typing issues
    TType extends MultipleChoiceQuestionType,
    TValue,
    TData extends MultipleChoiceQuestionData<TType, TValue> = MultipleChoiceQuestionData<TType, TValue>
  >
  extends ChoiceQuestion<TType, TValue, TData>
  implements DataAccessor<MultipleChoiceQuestionData<TType, TValue>>
{
  /**
   * Whether or not the same choice can be selected multiple times. @defaultValue false
   * NB. `allowDuplicates` is assumed `false` if `ordered` is `true`.
   */
  get allowDuplicates(): boolean {
    return !this.data.ordered && (this.data.allowDuplicates ?? false);
  }

  /**
   * Whether or not the answer options can be ordered. @defaultValue false
   */
  get ordered(): boolean {
    return this.data.ordered ?? false;
  }

  /**
   * Get the `Choice` objects corresponding to their `Id`s. If the question is `ordered`, the choices are returned in the same order as the ids, otherwise they follow the order in which they are in the question’s data.
   * NB. If `allowDuplicates` is `false`, duplicate `Choice`s will be removed.
   * @param ids - The `Id`s of the choices to retrieve.
   */
  getChoices(ids: Array<Id>): Array<Choice<TValue>> {
    if (this.ordered) return this.data.choices.filter((c) => ids.includes(`${c.id}`));
    const choices = ids.map((id) => this.getChoice(id)).filter((c) => c != null);
    return this.allowDuplicates ? choices : removeDuplicates(choices);
  }

  protected _ensureValue(value: NonNullable<unknown>) {
    const array = ensureArray(value, (v) => this._ensureChoice(v));
    if (isMissingValue(array) || this.allowDuplicates) return array;
    return ensureUnique(array);
  }
}
