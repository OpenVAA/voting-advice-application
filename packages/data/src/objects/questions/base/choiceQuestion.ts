import {
  type Choice,
  type ChoiceQuestionData,
  type ChoiceQuestionType,
  type DataAccessor,
  DataProvisionError,
  DataRoot,
  ensureString,
  type Id,
  MISSING_VALUE,
  type MissingValue,
  Question,
  validateChoices
} from '../../../internal';

/**
 * An abstract base class for all questions which have enumerated answering choices. Non-abstract subclasses should inherit from either of the two subclasses `SingleChoiceQuestion` or `MultipleChoiceQuestion`.
 */
export abstract class ChoiceQuestion<
    // We need to unelegantly provide `TType` and `TValue` twice because inferring then from `TData` leads to typing issues
    TType extends ChoiceQuestionType,
    TValue = undefined,
    TData extends ChoiceQuestionData<TType, TValue> = ChoiceQuestionData<TType, TValue>
  >
  extends Question<TType, TData>
  implements DataAccessor<ChoiceQuestionData<TType, TValue>>
{
  constructor({ data, root }: { data: TData; root: DataRoot }) {
    if (!validateChoices(data.choices))
      throw new DataProvisionError(
        `Invalid choice ids for ChoiceQuestion: ${data.choices.map((c) => `${c.id}`).join(', ')}`
      );
    super({ data, root });
  }

  /**
   * Return a copy (for immutability) of the choices for this question.
   */
  get choices(): Array<Choice<TValue>> {
    return [...this.data.choices];
  }

  /**
   * Get a Choice object by its @param id.
   * @returns The `Choice` object or `undefined` if no such choice exists.
   */
  getChoice(id: Id): Choice<TValue> | undefined {
    return this.data.choices.find((c) => `${c.id}` === `${id}`);
  }

  /**
   * Get the index of a Choice by its @param id.
   * @returns The index of the choice with the id or `undefined` if no such choice exists.
   */
  getChoiceIndex(id: Id): number | undefined {
    return this.data.choices.findIndex((c) => `${c.id}` === `${id}`);
  }

  /**
   * Assert that @param value - is a valid choice id for this question.
   * @returns The choice id or `MISSING_VALUE` if the value is not a valid.
   */
  protected _ensureChoice(value: unknown): Id | MissingValue {
    const id = ensureString(value);
    return id && this.getChoice(id) ? id : MISSING_VALUE;
  }
}
