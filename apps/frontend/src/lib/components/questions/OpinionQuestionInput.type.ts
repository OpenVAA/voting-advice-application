import type { Answer, AnyQuestionVariant } from '@openvaa/data';
import type { QuestionInputProps } from '../input';

export type OpinionQuestionInputProps = QuestionInputProps & {
  /**
   * The opinion `Question` whose input to show. Not reactive.
   */
  question: AnyQuestionVariant;
  /**
   * The `Answer` object to the question. Not reactive.
   */
  answer?: Answer | null;
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
   * Bindable. `true` when the current selection constitutes a saveable answer.
   * Only the multi-choice branch computes it, by delegating to the shared validity helper in `$lib/utils/multiChoiceValidity` (count >= effectiveMin && count <= effectiveMax, with effectiveMin = `minSelections ?? 1` clamped to a floor of 1 and effectiveMax = `maxSelections ?? choices.length` — so zero selections is always invalid-as-unanswered, an explicitly authored `minSelections: 0` included); all other branches leave it `true`. Callers use it to gate Save (candidate) or keep the action button as Skip (voter) — the component itself never disables anything. In the multi-choice branch the value is assigned SYNCHRONOUSLY before the bubbled `onChange`, so a caller reading it inside the same onChange stack sees fresh validity.
   * @default true
   */
  valid?: boolean;
  /**
   * Event handler triggered when the value changes.
   * @param value - The new value of the input. NB. The type of `value` is guaranteed to be correct for the question type or a `LocalizedString` in case localizable questions but we cannot type it.
   * @param question - The `Question` to which the answer is.
   */
  onChange?: (details: { value: unknown; question: AnyQuestionVariant }) => void;
};
