import type { AnyEntityVariant } from '@openvaa/data';
import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';

/**
 * One option of an `EntitySelector`: an entity shown as a card, or a plain row.
 */
export type EntitySelectorOption = {
  /**
   * The value `selected` holds while the option is chosen. Unique within the group.
   */
  value: string;
  /**
   * The option’s name: the accessible name of its radio, and the text of a plain row.
   */
  name: string;
  /**
   * A line shown under the option, which its radio is described by.
   */
  hint?: string;
} & (
  | {
      /**
       * An option that stands for an entity and is shown as its card.
       */
      kind: 'entity';
      /**
       * The entity the card shows: an object of the data root.
       */
      entity: AnyEntityVariant;
    }
  | {
      /**
       * A plain option, shown as its name: the choice of no entity (`none`), of one that is not listed (`other`), or of one the group no longer lists (`unlisted`).
       */
      kind: 'none' | 'other' | 'unlisted';
    }
);

export type EntitySelectorProps = SvelteHTMLElements['fieldset'] & {
  /**
   * The group’s name, rendered as its legend.
   */
  legend: string;
  /**
   * The options, rendered in the order given.
   */
  options: ReadonlyArray<EntitySelectorOption>;
  /**
   * The `value` of the chosen option, `undefined` while nothing is chosen. Bindable. @default undefined
   */
  selected?: string;
  /**
   * Whether a choice is required. The group is then marked `aria-required`, and a badge is shown beside the legend until something is chosen. @default false
   */
  required?: boolean;
  /**
   * The error line. Its presence puts the group in error.
   */
  error?: string;
  /**
   * A line shown under the legend while none of the options is an entity.
   */
  emptyMessage?: string;
  /**
   * Content rendered directly under the chosen option’s row, given that option.
   */
  detail?: Snippet<[EntitySelectorOption]>;
  /**
   * Called with the chosen option’s `value` when the user chooses.
   */
  onChange?: (value: string) => void;
};
