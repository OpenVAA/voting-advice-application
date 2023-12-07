import type {AriaRole} from 'svelte/elements';
import type {PageProps} from '../page';

export interface BasicPageProps extends PageProps {
  /**
   * Optional class string to add to the `<div>` tag wrapping the
   * `note` slot.
   */
  noteClass?: string;
  /**
   * Aria role for the `note` slot.
   *
   * @default 'note'
   */
  noteRole?: AriaRole;
  /**
   * Optional `aria-label` for the section that contains the primary page
   * actions.
   *
   * @default $_('aria.primaryActionsLabel')
   */
  primaryActionsLabel?: string | undefined | null;
}
