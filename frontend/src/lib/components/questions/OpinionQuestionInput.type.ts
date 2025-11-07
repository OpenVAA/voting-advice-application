import type { Answer, AnyQuestionVariant } from '@openvaa/data';
import type { VoterAnswer } from '$lib/contexts/voter';
import type { QuestionInputProps } from '../input';

export type OpinionQuestionInputProps = Omit<QuestionInputProps, 'answer' | 'question' | 'onChange'> & {
  /**
   * The opinion `Question` whose input to show. Not reactive.
   */
  question: AnyQuestionVariant;
  /**
   * The `Answer` or `VoterAnswer` object to the question. Not reactive.
   */
  answer?: Answer | VoterAnswer | null;
  /**
   * The same component can be used both for answering the questions and displaying answers. @default 'answer'
   */
  mode?: 'answer' | 'display';
  /**
   * The `Answer` of the other entity in `display` mode. @default undefined
   */
  otherAnswer?: Answer | null;
  /**
   * The label for the other entity's answer. Be sure to supply this if `otherSelected` is supplied.
   */
  otherLabel?: string;
  /**
   * Event handler triggered when the value changes.
   * @param value - The new value of the input. NB. The type of `value` is guaranteed to be correct for the question type or a `LocalizedString` in case localizable questions but we cannot type it.
   * @param question - The `Question` to which the answer is.
   */
  onChange?: (details: { value: unknown; question: AnyQuestionVariant }) => void;
};
