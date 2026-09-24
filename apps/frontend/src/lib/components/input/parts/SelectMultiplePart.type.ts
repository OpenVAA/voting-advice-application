import type { Id } from '@openvaa/core';
import type { AnyChoice } from '@openvaa/data';
import type { HTMLAttributes } from 'svelte/elements';

/**
 * Props for the `SelectMultiplePart` component — the options dropdown and the selected-chips region `Input` renders for its `select-multiple` kind.
 *
 * The part renders the branch and reports intent; the value, and the derivation of the selected and unselected option lists from it, stay with `Input`.
 */
export type SelectMultiplePartProps = {
  /**
   * The id of the owning `Input`, used as the `select` element's id and the label's `for`.
   */
  id: string;
  /**
   * The label shown inside the dropdown row, and read out with the per-option delete buttons.
   */
  label: string;
  /**
   * The placeholder shown as the dropdown's first, disabled option. Falls back to a selection-state dependent translated string. @default undefined
   */
  placeholder?: string | null;
  /**
   * Whether the dropdown is disabled. @default false
   */
  disabled?: boolean;
  /**
   * If `locked`, a lock badge is shown and the per-option delete buttons are withheld. @default false
   */
  locked?: boolean;
  /**
   * Whether to show the required badge. @default false
   */
  showRequired?: boolean;
  /**
   * Every selectable option. An empty or absent list renders the general error message instead of the dropdown. @default undefined
   */
  options?: ReadonlyArray<AnyChoice>;
  /**
   * The currently selected options, in the order `Input` derived them.
   */
  selectedOptions: ReadonlyArray<AnyChoice>;
  /**
   * The options not yet selected, which are the ones the dropdown offers.
   */
  unselectedOptions: ReadonlyArray<AnyChoice>;
  /**
   * The owning `Input`'s focus-target array. The dropdown binds its first entry, which is what `Input` refocuses after an option is deleted.
   */
  mainInputs: Array<HTMLElement>;
  /**
   * Any remaining attributes the caller passed to `Input`, spread onto the `select`. @default {}
   */
  restProps?: HTMLAttributes<HTMLElement>;
  /**
   * Event handler triggered when an option is selected in the dropdown.
   * @param event - The originating change event.
   */
  onChange?: (event: { currentTarget: HTMLSelectElement }) => void;
  /**
   * Event handler triggered when a selected option's delete button is pressed.
   * @param id - The id of the option to remove.
   */
  onDeleteOption?: (id: Id) => void;
};
