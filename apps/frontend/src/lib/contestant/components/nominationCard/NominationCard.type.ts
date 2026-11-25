import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';

export type NominationCardProps = SvelteHTMLElements['article'] & {
  /**
   * The card's heading: the name of the nomination's election.
   */
  title: string;
  /**
   * The test id of the card's heading.
   */
  titleTestId?: string;
  /**
   * The rows of the card, in order: each a label above its value.
   */
  rows: ReadonlyArray<NominationCardRow>;
  /**
   * What the card holds under its rows, such as its notes and its buttons.
   */
  children?: Snippet;
};

/**
 * One row of a nomination card.
 */
export type NominationCardRow = {
  /**
   * The row's label.
   */
  label: string;
  /**
   * The row's value, rendered as text.
   */
  value: string | undefined;
  /**
   * The test id of the row's value.
   */
  testId: string;
  /**
   * A line shown under the value, in the value's own element, such as that a name is a request or which constituency a nomination moves from.
   */
  line?: {
    /**
     * The line's text.
     */
    text: string;
    /**
     * The test id of the line.
     */
    testId: string;
  };
};
