import type { HasId } from '../../../internal';

/**
 * An answering choice for single or multiple choice questions. The `Choice` is referred to by its `id`.
 * @typeParam TValue - The type of the possible `normalizableValue` associated  with the choice. This is usually defined for ordinal questions, such as `SingleChoiceOrdinalQuestion`, and most likely a `number`.
 */
export type Choice<TValue = undefined> = HasId & {
  // From HasId
  // - id: Id;

  /**
   * The text label for this choice, shown to the user.
   */
  label: string;
} & (TValue extends undefined
    ? {
        /**
         * For categorical question types, the value cannot be defined.
         */
        normalizableValue?: undefined | null;
      }
    : {
        /**
         * A value that is used for when computing the normalized value for this choice.
         */
        normalizableValue: TValue;
      });

export type AnyChoice = Choice<undefined> | Choice<unknown>;
