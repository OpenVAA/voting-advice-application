import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';

export type EntityCardProps = SvelteHTMLElements['article'] & {
  /**
   * Additional content to render inside the card.
   */
  children?: Snippet;
  /**
   * Custom action to take when the card is clicked, defaults to a link to the entity’s `ResultEntity` route. If the card has subentites, the action will only be triggered by clicking the content above them.
   */
  action?: CardAction;
  /**
   * A possibly ranked entity, e.g. candidate or a party.
   */
  entity: MaybeWrappedEntityVariant;
  /**
   * The context-dependend layout variant. Usually set automatically. @default 'list'
   */
  variant?: 'list' | 'details' | 'subcard';
  /**
   * The maximum number of sub-entities to show. If there are more a button will be shown for displaying the remaining ones. @default 3
   */
  maxSubcards?: number;
  /**
   * Whether to show the possible nomination’s election and constituency. @default false
   */
  showElection?: boolean;
  /**
   * Whether to render the card header only: avatar, title and subtitle. Featured questions, sub-matches and sub-cards are neither rendered nor looked up, so the card needs no question data. @default false
   */
  headerOnly?: boolean;
  /**
   * Whether to show the entity’s type, e.g. “candidate” or “party”, in the subtitle. @default false
   */
  showType?: boolean;
  /**
   * Whether a link action keeps the scroll position. Set to `false` when the action navigates to another page rather than opening an overlay over the list. @default true
   */
  keepScroll?: boolean;
};

/**
 * Either an url string, a `MouseEvent` handler or `false` to prevent any action.
 */
export type CardAction = string | ((e: MouseEvent) => void) | false;
