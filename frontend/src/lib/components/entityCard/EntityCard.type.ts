import type {SvelteHTMLElements} from 'svelte/elements';
import type {InfoAnswerProps} from '../infoAnswer';
export type EntityCardProps = SvelteHTMLElements['article'] & {
  /**
   * The action to take when the card is clicked. If the card has subentites, the action will only be triggered by clicking the header of the card.
   */
  action?: CardAction;
  /**
   * A possibly ranked entity, e.g. candidate or a party.
   */
  content: MaybeRanked;
  /**
   * The context in which the card is used, affects layout. @default 'list'
   */
  context?: 'list' | 'details' | 'subcard';
  /**
   * Possible question whose answers should be shown in the card, along with possibly options for their display.
   */
  questions?: {
    /**
     * The question whose answer is shown.
     */
    question: QuestionProps;
    /**
     * Whether to hide the question label in the card.
     */
    hideLabel?: boolean;
    /**
     * How to format the answer. See `<InfoAnswer>` for details. @default 'default'
     */
    format?: InfoAnswerProps['format'];
  }[];
  /**
   * Possible sub-entities of the entity to show in the card, e.g. candidates for a party.
   */
  subcards?: EntityCardProps[];
  /**
   * The maximum number of sub-entities to show. If there are more a button will be shown for displaying the remaining ones. @default 3
   */
  maxSubcards?: number;
};

/**
 * Either an url string, a `MouseEvent` handler, or `undefined` if no action should be performed.
 */
export type CardAction = string | ((e: MouseEvent) => void) | undefined;
