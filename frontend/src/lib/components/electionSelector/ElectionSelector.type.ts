import type { Id } from '@openvaa/core';
import type { Election } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';

export type ElectionSelectorProps = SvelteHTMLElements['div'] & {
  /**
   * The `Election`s to show.
   */
  elections: Array<Election>;
  /**
   * Bindable value for the `Id`s of the selected elections.
   */
  selected?: Array<Id>;
  /**
   * Callback triggered when the selection changes.
   */
  onChange?: (selected: Array<Id>) => void;
};
