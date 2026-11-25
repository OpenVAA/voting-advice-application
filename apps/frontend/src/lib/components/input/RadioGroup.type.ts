import type { Snippet } from 'svelte';
import type { HTMLAttributes, SvelteHTMLElements } from 'svelte/elements';
import type { RadioProps } from './Radio.type';

/**
 * One option of a `RadioGroup`: the value it stands for and its text.
 */
export type RadioGroupOption<TValue extends string = string> = {
  value: TValue;
  label: string;
};

export type RadioGroupProps<TValue extends string = string> = Omit<SvelteHTMLElements['fieldset'], 'children'> & {
  /**
   * The text of the group's `<legend>`, which names the group.
   */
  legend: string;
  /**
   * The name the group's radios share.
   */
  name: string;
  /**
   * The options, in the order they are shown.
   */
  options: ReadonlyArray<RadioGroupOption<TValue>>;
  /**
   * Bindable: The chosen option's value. Nothing is chosen until the user chooses or the caller writes it.
   */
  selected?: TValue;
  /**
   * Bindable: The message shown under the options while the group is in error. The caller decides when the group is in error; the group clears the message when an option is chosen.
   */
  error?: string;
  /**
   * What is shown under the chosen option, inside that option's block. Rendered for the chosen option alone.
   */
  option?: Snippet<[value: TValue]>;
  /**
   * Called with the option's value each time the user chooses an option, after the error is cleared.
   */
  onchoose?: (value: TValue) => void;
  /**
   * The id of the fieldset. The error takes the id `<id>-error`. @default a generated id
   */
  id?: string;
  /**
   * Any attributes of the `<legend>`. A `class` is merged with the legend's own classes.
   */
  legendProps?: HTMLAttributes<HTMLLegendElement>;
  /**
   * Any attributes of the block that holds an option's radio and the content under it, given per option.
   */
  optionProps?: (value: TValue) => HTMLAttributes<HTMLDivElement>;
  /**
   * Any further props of an option's `Radio`, given per option: attributes of the `<input>`, and `containerProps` for its label. A choice is reported through `onchoose`, not `onchange`.
   */
  radioProps?: (
    value: TValue
  ) => Omit<RadioProps<TValue>, 'group' | 'value' | 'name' | 'label' | 'children' | 'onchange'>;
  /**
   * The `data-testid` of the error.
   */
  errorTestId?: string;
};
