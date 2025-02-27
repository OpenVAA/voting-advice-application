import type { Answer, AnyQuestionVariant } from '@openvaa/data';
import type { InputPropsBase } from './Input.type';

export type QuestionInputProps = Partial<Omit<InputPropsBase<unknown>, 'choices' | 'onChange' | 'ordered'>> & {
  /**
   * The `Question` whose input to show. Not reactive.
   */
  question: AnyQuestionVariant;
  /**
   * The `Answer` object to the question. Not reactive.
   */
  answer?: Answer | null;
  /**
   * If `true`, text inputs will not be multilingual. @default false
   */
  disableMultilingual?: boolean;
  /**
   * Event handler triggered when the value changes.
   * @param value - The new value of the input. NB. The type of `value` is guaranteed to be correct for the question type or a `LocalizedString` in case localizable questions but we cannot type it.
   * @param question - The `Question` to which the answer is.
   */
  onChange?: (details: { value: unknown; question: AnyQuestionVariant }) => void;
};
