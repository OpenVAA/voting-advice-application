import type { Id } from '@openvaa/core';
import type { SvelteHTMLElements } from 'svelte/elements';

export type SelectProps = SvelteHTMLElements['select'] & {
  /**
   * The `ConstituencyGroup` to show.
   */
  options: Array<{ id: Id; label: string }>;
  /**
   * Controls autocomplete behavior; supported values: `on` or `off`. @default `off`
   */
  autocomplete?: 'on' | 'off';
  /**
   * The `aria-label` and placeholder text for the select input. Default `$t('components.constituencySelector.selectPrompt')`.
   */
  label?: string;
  /**
   * Set to `true` if using the component on a dark (`base-300`) background. @default false
   */
  onShadedBg?: boolean;
  /**
   * Bindable value for the `Id`s of the selected item.
   */
  selected?: Id;
  /**
   * Callback triggered when the selection changes.
   */
  onChange?: (selected: Id | undefined) => void;
};
