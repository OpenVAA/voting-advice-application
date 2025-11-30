import type { SvelteHTMLElements } from 'svelte/elements';

export type SelectProps = SvelteHTMLElements['select'] & {
  /**
   * The list of selectable options. You can provide an array of objects with `id` and `label` properties, or an array of strings in which case the ids will be the same as the labels. @default []
   */
  options: Array<{ id: string; label: string }> | Array<string>;
  /**
   * Controls autocomplete behavior; supported values: `on` or `off`. @default `off`
   */
  autocomplete?: 'on' | 'off';
  /**
   * The optional name for the form element (possibly hidden) holding the select value.
   */
  name?: string;
  /**
   * The `aria-label` and placeholder text for the select input. Default `$t('components.select.placeholder')`.
   */
  label?: string;
  /**
   * Set to `true` if using the component on a dark (`base-300`) background. @default false
   */
  onShadedBg?: boolean;
  /**
   * Bindable value for the id of the selected item.
   */
  selected?: string;
  /**
   * Callback triggered when the selection changes.
   */
  onChange?: (selected: string | undefined) => void;
};
