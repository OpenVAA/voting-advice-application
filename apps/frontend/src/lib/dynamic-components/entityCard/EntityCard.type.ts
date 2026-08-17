import type { SvelteHTMLElements } from 'svelte/elements';

export type EntityCardProps = SvelteHTMLElements['article'] & {
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
};

/**
 * Either an url string, a `MouseEvent` handler or `false` to prevent any action.
 */
export type CardAction = string | ((e: MouseEvent) => void) | false;
