import type { NumberQuestion } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';

export type NumberScaleInputProps = SvelteHTMLElements['div'] & {
  /**
   * The `NumberQuestion` whose value to input or display. The component assumes a valid range (`question.min` and `question.max` both defined and non-equal); the caller (`OpinionQuestionInput`) gates on `question.isMatchable` so a rangeless number question never reaches this component. Not reactive.
   */
  question: NumberQuestion;
  /**
   * The same component can be used both for answering the question (`'answer'`) and displaying answers read-only (`'display'`). @default 'answer'
   */
  mode?: 'answer' | 'display';
  /**
   * The voter's current numeric answer, or `null`/`undefined` when unanswered. @default undefined
   */
  value?: number | null;
  /**
   * The other entity's numeric answer in `display` mode. @default undefined
   */
  otherValue?: number | null;
  /**
   * The label for the other entity's answer in `display` mode. Be sure to supply this if `otherValue` is supplied.
   */
  otherLabel?: string;
  /**
   * Set to `true` if using the component on a dark (`base-300`) background. @default false
   */
  onShadedBg?: boolean;
  /**
   * Triggered when the voter releases the slider or steps it with the keyboard — fired on the `change` event only, never per drag pixel. The `value` is routed through `question.ensureValue`.
   */
  onChange?: (details: { question: NumberQuestion; value: number }) => void;
};
