import type { Snippet } from 'svelte';
import type { HTMLInputAttributes, HTMLLabelAttributes } from 'svelte/elements';

export type RadioProps<TValue extends string = string> = Omit<
  HTMLInputAttributes,
  'type' | 'name' | 'value' | 'group' | 'checked' | 'children' | 'disabled'
> & {
  /**
   * Bindable: the value of the group's chosen radio. This radio is checked while it equals `value`, and choosing this radio writes `value` to it.
   */
  group?: TValue;
  /**
   * The value this radio stands for.
   */
  value: TValue;
  /**
   * The name the group's radios share.
   */
  name: string;
  /**
   * The text of the radio. Ignored when `children` is given.
   */
  label?: string;
  /**
   * The content of the label after the radio, in place of `label`.
   */
  children?: Snippet;
  /**
   * Works as a native radio's `disabled`. @default false
   */
  disabled?: boolean;
  /**
   * Any attributes of the `<label>` that holds the radio and its text. A `class` is merged with the label's own classes.
   */
  containerProps?: HTMLLabelAttributes;
};
