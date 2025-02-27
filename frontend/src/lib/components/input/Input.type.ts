import type { Id } from '@openvaa/core';
import type { AnyChoice, Image } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';

export type InputProps =
  | ({
      type: 'text';
    } & InputPropsBase<string>)
  | ({
      type: 'url';
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
   * - `default`. The label is shown next to the input.
   * - `compact`. The label is only shown in the possible placeholder value and to screen readers. Onlu use when the function of the input is clear from the context.
   */
  // variant?: 'default' | 'on-shaded';
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
   * If `true`, a badge will be displayed next to the input. @default false
   */
  required?: boolean;
  /**
   * Bindable: the value of the input.
   */
  value?: TValue | null;
  /**
   * Set to `true` if using the component on a dark (`base-300`) background. @default false
   */
  onShadedBg?: boolean;
  /**
   * Event handler triggered when the value changes.
   * NB. The type of `value` is `TValue` but TS will not let us define it here.
   * @param value - The new value of the input. In case of an `image`, it will be a `ImageWithFile` object with a `file` property.
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
  /**
   * The maximum file size for `image` inputs. @default 20 * 1024**2 (20MB)
   */
  maxFilesize?: TValue extends Image ? number : never;
  /**
   * Additional info displayed below the input for multilingual input together with possible `info`. @default $t('components.input.multilingualInfo')
   */
  multilingualInfo?: TValue extends LocalizedString ? string : never;
};
