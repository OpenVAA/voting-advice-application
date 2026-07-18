import type { Id } from '@openvaa/core';
import type {
  BooleanQuestion,
  Choice,
  MultipleChoiceCategoricalQuestion,
  SingleChoiceCategoricalQuestion,
  SingleChoiceOrdinalQuestion
} from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';

export type QuestionChoicesProps = SvelteHTMLElements['fieldset'] & {
  /**
   * The `ChoiceQuestion` object. `BooleanQuestion` is also accepted when an
   * explicit `choices` prop is supplied to synthesize the Yes/No pseudo-choices.
   * `MultipleChoiceCategoricalQuestion` activates checkbox multi-select mode.
   */
  question:
    | SingleChoiceCategoricalQuestion
    | SingleChoiceOrdinalQuestion
    | BooleanQuestion
    | MultipleChoiceCategoricalQuestion;
  /**
   * Explicit choices to render. When provided, overrides `question.choices`.
   * Required for `BooleanQuestion` (which has no native `choices`); synthesized
   * by the caller (e.g. `OpinionQuestionInput.svelte` boolean branch). @default undefined
   */
  choices?: Array<Choice>;
  /**
   * Whether to disable all the buttons. @default false
   */
  disabled?: boolean;
  /**
   * The same component can be used both for answering the questions and displaying answers. @default 'answer'
   */
  mode?: 'answer' | 'display';
  /**
   * The `Id` of the initially selected `Choice`. @default undefined
   */
  selectedId?: Id | null;
  /**
   * The `Id`s of the initially selected `Choice`s in checkbox multi-select mode
   * (`MultipleChoiceCategoricalQuestion`). The multi-mode counterpart of
   * `selectedId`. @default undefined
   */
  selectedIds?: Array<Id> | null;
  /**
   * The `Id` of the `Choice` selected by the other entity in `display` mode. @default undefined
   */
  otherSelected?: Id | null;
  /**
   * The `Id`s of the `Choice`s selected by the other entity in `display` mode in
   * checkbox multi-select mode. The multi-mode counterpart of `otherSelected`.
   * @default undefined
   */
  otherSelectedIds?: Array<Id> | null;
  /**
   * The label for the other entity's answer. Be sure to supply this if `otherSelected` is supplied.
   */
  otherLabel?: string;
  /**
   * Set to `true` if using the component on a dark (`base-300`) background. @default false
   */
  onShadedBg?: boolean;
  /**
   * Whether to show a line connecting the choices. @default true for ordinal questions, and false for categorical questions.
   */
  showLine?: boolean;
  /**
   * Defines the layout variant of the buttons. The `vertical` variant can be used for questions with longer labels. @default 'horizontal' for ordinal questions, and 'vertical' for categorical questions.
   */
  variant?: 'horizontal' | 'vertical';
  /**
   * Triggered when user has clicked on the same radio button that was initially selected.
   */
  onReselect?: (details: ChoiceEventData) => void;
  /**
   * Triggered when the user has clicked on a different radio button than which was initially selected or there was no selected value initially.
   */
  onChange?: (details: ChoiceEventData) => void;
};

/**
 * The event detail of the events fired by the radio buttons.
 */
type ChoiceEventData = {
  /**
   * The `Question` in question.
   */
  question: QuestionChoicesProps['question'];
  /**
   * The `Id` of the selected `Choice` (single-choice/boolean mode), the array of
   * selected `Id`s (checkbox multi-select mode), or `undefined`/`null` if none is
   * selected. An empty array in multi-select mode signals zero selections
   * (unanswered).
   */
  value?: Id | Array<Id> | null;
};
