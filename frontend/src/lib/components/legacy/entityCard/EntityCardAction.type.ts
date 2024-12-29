import type { HTMLAttributes } from 'svelte/elements';
import type { CardAction } from './EntityCard.type';

export type EntityCardActionProps = HTMLAttributes<HTMLElement> & {
  /**
   * The action to take when the part or card is clicked.
   */
  action?: CardAction;
  /**
   * Whether to shade the element on hover. Use when applying to subcards or their parent card's header. @default false
   */
  shadeOnHover?: boolean;
};
