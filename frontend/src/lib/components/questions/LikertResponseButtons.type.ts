import type {SvelteHTMLElements} from 'svelte/elements';

export type LikertResponseButtonsProps = SvelteHTMLElements['fieldset'] & {
  /**
   * The `name` of the radio group. Usually the question's id
   */
  name: QuestionProps['id'];
  /**
   * The `key`-`label` pairs of the radio buttons
   */
  options: QuestionProps['options'];
  /**
   * The same component can be used both for answering the questions and displaying answers.
   * @default 'answer'
   */
  mode?: 'answer' | 'display';
  /**
   * The initially selected key of the radio group.
   * @default undefined
   */
  selectedKey?: AnswerOption['key'] | null;
  /**
   * The answer key of the entity in display mode.
   * @default undefined
   */
  entityKey?: AnswerOption['key'] | null;
  /**
   * The label for the entity's answer. Be sure to supply this if `entityKey` is supplied.
   */
  entityLabel?: string;
};

/**
 * The event types fired by the radio buttons:
 * - `reselect`: The user has clicked on the same radio button that
 *   was initially selected.
 * - `change`: The user has clicked on a different radio button than
 * which was initially selected or there was no selected value initially
 */
export type LikertResponseButtonsEventType = 'reselect' | 'change';

/**
 * The event detail of the events fired by the radio buttons.
 */
export type LikertResponseButtonsEventDetail = {
  /**
   * The `name` of the radio group. Usually the question's id
   */
  id: LikertResponseButtonsProps['name'];
  /**
   * The selected key of the radio group.
   */
  value: AnswerOption['key'];
};
