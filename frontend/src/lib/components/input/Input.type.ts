import type {SvelteHTMLElements} from 'svelte/elements';
import type {Photo} from '$lib/types/candidateAttributes';

export type InputProps =
  | ({
      type: 'text';
    } & InputPropsBase<string> &
      SvelteHTMLElements['input'])
  | ({
      type: 'text-multilingual';
    } & InputPropsBase<LocalizedString> &
      SvelteHTMLElements['input'])
  | ({
      type: 'textarea';
    } & InputPropsBase<string> &
      SvelteHTMLElements['textarea'])
  | ({
      type: 'textarea-multilingual';
    } & InputPropsBase<LocalizedString> &
      SvelteHTMLElements['textarea'])
  | ({
      type: 'number';
    } & InputPropsBase<number> &
      SvelteHTMLElements['input'])
  | ({
      type: 'date';
    } & InputPropsBase<Date> &
      SvelteHTMLElements['input'])
  | ({
      type: 'boolean';
    } & InputPropsBase<boolean> &
      SvelteHTMLElements['input'])
  | ({
      type: 'image';
    } & InputPropsBase<Photo> &
      SvelteHTMLElements['input'])
  // TODO: Possibly implement
  // | ({
  //   type: 'image-multiple';
  //   isOrdered?: boolean;
  // } & InputPropsBase<Array<Photo>> & SvelteHTMLElements['input'])
  | ({
      type: 'select';
      options: Array<Option>;
    } & InputPropsBase<Key> &
      SvelteHTMLElements['select'])
  | ({
      type: 'select-multiple';
      options: Array<Option>;
      isOrdered?: boolean;
    } & InputPropsBase<Array<Key>> &
      SvelteHTMLElements['select']);

export type Key = string;

type Option = {
  key: Key;
  label: string;
};

type InputPropsBase<TValue> = {
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
   * If `locked` the input will be disabled and a lock icon is displayed.
   */
  locked?: boolean;
  /**
   * Bindable: The value of the input.
   */
  value?: TValue;
  /**
   * Event handler triggered when the value changes.
   * @param value The new value of the input.
   */
  onChange?: (value: TValue | undefined) => void;
  /**
   * If `true` the input's values will be cached in the browser's local storage.
   */
  isCached?: boolean;
  /**
   * The options to show for a `select` or `select-multiple` input.
   */
  options?: Array<Option>;
  /**
   * If `true`, enables ordering of the values of a `select-multiple` input.
   */
  ordered?: boolean;
  /**
   * Works the same way as a normal `input`'s `disabled` attribute.
   */
  disabled?: boolean;
};

export type InputType = InputProps['type'];
