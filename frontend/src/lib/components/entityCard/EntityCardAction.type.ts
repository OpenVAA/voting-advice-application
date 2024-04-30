import type {CardAction} from './EntityCard.type';
export interface EntityCardActionProps {
  /**
   * The action to take when the part or card is clicked.
   */
  action?: CardAction;
  /**
   * Whether to shade the element on hover. Use when applying to subcards or their parent card's header. @default false
   */
  shadeOnHover?: boolean;
}
