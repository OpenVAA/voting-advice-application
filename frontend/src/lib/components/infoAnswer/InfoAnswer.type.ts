import type {HTMLAttributes} from 'svelte/elements';

/**
 * The type extends HTMLAttributes<HTMLElement> because we don't know ahead of time which element will be used.
 */
export type InfoAnswerProps = HTMLAttributes<HTMLElement> & {
  /**
   * The possibly wrapped entity whose answer will be displayed.
   */
  entity: MaybeRanked;
  /**
   * The info question object.
   */
  question: QuestionProps;
  /**
   * How to format the answer. @default 'default'
   * - `default`: use the same format as in `<EntityDetails>`.
   * - `tag`: format the answers as a pill or tag. Nb. links are always rendered as tags.
   */
  format?: 'default' | 'tag';
  /**
   * Whether to not render the `common.missingAnswer` string for missing answers. If `true`, nothing will be rendered. @default false
   */
  hideMissing?: boolean;
};
