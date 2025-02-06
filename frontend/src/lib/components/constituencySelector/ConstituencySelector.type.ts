import type { Id } from '@openvaa/core';
import type { Election } from '@openvaa/data';
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
   * Bindable value for the `Id`s of the selected `Constituency`s organized by `Election`.
   */
  selected?: { [electionId: Id]: Id | '' };
  /**
   * A utility bindable value which is `true` when a selection has been made for each `Election`.
   */
  readonly selectionComplete?: boolean;
  /**
   * Callback triggered when the selection changes.
   */
  onChange?: (details: { selected: { [electionId: Id]: Id }; selectionComplete: boolean }) => void;
};
