import type { Id } from '@openvaa/core';
import type { ConstituencyGroup, Election } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';

export type MultiConstituencySelectorProps = SvelteHTMLElements['div'] & {
  /**
   * The `Election`s for which to show the `Constituency`s.
   */
  elections: Array<Election>;
  /**
   * If `true`, the `Constituency`s are not ordered alphabetically. Default `false`.
   */
  disableSorting?: boolean;
  /**
   * Set to `true` if using the component on a dark (`base-300`) background. @default false
   */
  onShadedBg?: boolean;
  /**
   * Bindable value for the `Id`s of the selected `Constituency`s of each `Election`, by the `Election`'s `Id`. A `Constituency` that several of the `Election`s are held in is selected for each of them on its own, apart from `useSingleGroup`, where what is selected is selected for every `Election`.
   */
  selected?: Record<Id, Array<Id>>;
  /**
   * If specified, only this group is offered for selection, as one list for every `Election`. To be used when the `elections.startFromConstituencyGroup` setting is set.
   */
  useSingleGroup?: ConstituencyGroup;
  /**
   * A utility bindable value which is `true` when at least one `Constituency` is selected for each `Election`, or in the single group if `useSingleGroup` is set.
   */
  readonly selectionComplete?: boolean;
  /**
   * Callback triggered when the selection changes.
   */
  onChange?: (details: { selected: Record<Id, Array<Id>>; selectionComplete: boolean }) => void;
};
