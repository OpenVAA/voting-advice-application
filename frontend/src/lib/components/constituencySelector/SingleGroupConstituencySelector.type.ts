import type { Id } from '@openvaa/core';
import type { ConstituencyGroup } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';

export type SingleGroupConstituencySelectorProps = SvelteHTMLElements['select'] & {
  /**
   * The `ConstituencyGroup` to show.
   */
  group: ConstituencyGroup;
  /**
   * The `aria-label` and placeholder text for the select input. Default `$t('components.constituencySelector.selectPrompt')`.
   */
  label?: string;
  /**
   * If `true`, the `Constituency`s are not ordered alphabetically. Default `false`.
   */
  disableSorting?: boolean;
  /**
   * Set to `true` if using the component on a dark (`base-300`) background. @default false
   */
  onShadedBg?: boolean;
  /**
   * Bindable value for the `Id`s of the selected `Constituency`.
   */
  selected?: Id;
  /**
   * Callback triggered when the selection changes.
   */
  onChange?: (selected: Id | undefined) => void;
};
