import type { Id } from '@openvaa/core';
import type { ConstituencyGroup, Election } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';

export type ConstituencySelectorProps = SvelteHTMLElements['div'] & {
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
   * Bindable value for the `Id`s of the selected `Constituency`s organized by `Election`.
   */
  selected?: { [electionId: Id]: Id | '' };
  /**
   * If specified, the only this group is offered for selection and the `Constituency`s for the `Election`s are implied from this one. Only meaningful when there are multiple `Election`s whose `ConstituencyGroup` hierarchies overlap only partially. To be used when the `elections.startFromConstituencyGroup` setting is set.
   */
  useSingleGroup?: ConstituencyGroup;
  /**
   * A utility bindable value which is `true` when a selection has been made for each `Election` or for the single group if `useSingleGroup` is set.
   */
  readonly selectionComplete?: boolean;
  /**
   * Callback triggered when the selection changes.
   */
  onChange?: (details: { selected: { [electionId: Id]: Id }; selectionComplete: boolean }) => void;
};
