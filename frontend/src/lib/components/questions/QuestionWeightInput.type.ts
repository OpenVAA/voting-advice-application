import type { SvelteHTMLElements } from 'svelte/elements';
import type { QuestionWeightConfig } from '$lib/utils/matching';

export type QuestionWeightInputProps = SvelteHTMLElements['div'] & {
  /**
   * Event handler triggered when the value changes.
   * @param value - The new value of the input.
   */
  onChange?: (value: number) => unknown;
  /**
   * The initial value for the weight. Not reactive.
   */
  selected: number;
  /**
   * The allowed options.
   */
  options: QuestionWeightConfig;
  /**
   * The same component can be used both for setting and displaying weights. @default 'answer'
   */
  mode?: 'set' | 'display';
};
