import type { SvelteHTMLElements } from 'svelte/elements';
import type { IconName } from '$lib/components/icon';
export type ToggleProps = SvelteHTMLElements['fieldset'] & {
  /**
   * The aria label for the toggle.
   */
  label: string;
  /**
   * The options for the toggle. Each must contain a `key` and a `label` property. If an `icon` property is provided, the option will be rendered as an icon button. The `label` is still required and will be used for a screen-reader-only label.
   */
  options: Array<ToggleOption>;
  /**
   * The currently selected option `key` of the toggle. Bind to this to get the currently selected value.
   */
  selected?: string;
};

type ToggleOption = {
  /**
   * The key of the option used to set the `selected` property.
   */
  key: string;
  /**
   * The text label of the option. Only shown for screen readers if `icon` is provided.
   */
  label: string;
  /**
   * The icon of the option. If provided, the option will be rendered as an icon button without a text label.
   */
  icon?: IconName;
};
