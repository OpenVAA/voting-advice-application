import type { AriaRole } from 'svelte/elements';
import type { PageProps } from '../page';

export interface SingleCardPageProps extends PageProps {
  /**
   * Optional class string to add to the `<div>` tag that defines the card wrapping the `default` slot.
   */
  cardClass?: string;
  /**
   * Optional class string to add to the `<div>` tag wrapping the `note` slot.
   */
  noteClass?: string;
  /**
   * Aria role for the `note` slot. @default 'note'
   */
  noteRole?: AriaRole;
}
