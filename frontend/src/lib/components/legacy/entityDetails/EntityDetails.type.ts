import type { SvelteHTMLElements } from 'svelte/elements';

export type EntityDetailsProps = SvelteHTMLElements['article'] & {
  /**
   * A possibly ranked entity, e.g. candidate or a party.
   */
  content: LegacyMaybeRanked;
  /**
   * The list of Question objects to use for showing for on the basic (non-opinion) information tab.
   */
  infoQuestions: Array<LegacyQuestionProps>;
  /**
   * The list of Question objects to use for showing for on the opinions tab.
   */
  opinionQuestions: Array<LegacyQuestionProps>;
};
