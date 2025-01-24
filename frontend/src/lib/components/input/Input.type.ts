import type { Id } from '@openvaa/core';
import type { AnyChoice, Image } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';

export type InputProps =
  | ({
      type: 'text';
    } & InputPropsBase<string>)
  | ({
      type: 'text-multilingual';
    } & InputPropsBase<LocalizedString>)
  | ({
      type: 'textarea';
    } & InputPropsBase<string, 'textarea'>)
  | ({
      type: 'textarea-multilingual';
    } & InputPropsBase<LocalizedString, 'textarea'>)
  | ({
      type: 'number';
    } & InputPropsBase<number>)
  | ({
      type: 'date';
    } & InputPropsBase<string>)
  | ({
      type: 'boolean';
    } & InputPropsBase<boolean>)
  | ({
      type: 'image';
    } & InputPropsBase<Image>)
  | ({
      type: 'select';
    } & InputPropsBase<Id, 'select'>)
  | ({
      type: 'select-multiple';
    } & InputPropsBase<Array<Id>, 'select'>);

/**
 * Any allowed `type` property in `InputProps`.
 */
export type InputType = InputProps['type'];

/**
 * @typeParam TValue - The type of value associated with the input.
 * @typeParam TElement - The type of the underlying HTML element for the input. Defaults to 'input'.
 */
export type InputPropsBase<TValue, TElement extends keyof SvelteHTMLElements = 'input'> = Omit<
  SvelteHTMLElements[TElement],
  'disabled' | 'id' | 'label' | 'value'
> & {
  /**
   * The stylistic variant to use. @default 'default'
   * - `default`. The input has a `base-300` background.
   * - `on-shaded`. The input has a `base-100` background.
   */
  variant?: 'default' | 'on-shaded';
  /**
   * The label to show for the input or group of inputs if `multilingual`.
   */
  label: string;
  /**
   * Any additional props to be passed to the container element of the input. @default {}
   */
  containerProps?: SvelteHTMLElements['div'];
  /**
   * The id of the input. If not provided, a unique id will be generated.
   */
  id?: string;
  /**
   * Additional info displayed below the input.
   */
  info?: string;
  /**
   * Works the same way as a normal `input`'s `disabled` attribute.
   */
  disabled?: boolean;
  /**
   * If `locked` the input will be disabled and a lock icon is displayed.
   */
  locked?: boolean;
  /**
   * Bindable: the value of the input.
   */
  value?: TValue | null;
  /**
   * Event handler triggered when the value changes.
   * @param value The new value of the input.
   * NB. The type of `value` is `TValue` but TS will not let us define it here.
   */
  onChange?: (value: unknown) => void;
  /**
   * The options to show for a `select` or `select-multiple` input.
   */
  options?: TElement extends 'select' ? Array<AnyChoice> : never;
  /**
   * If `true`, enables ordering of the values of a `select-multiple` input. @default false
   */
  ordered?: TValue extends Array<unknown> ? boolean : never;
};
