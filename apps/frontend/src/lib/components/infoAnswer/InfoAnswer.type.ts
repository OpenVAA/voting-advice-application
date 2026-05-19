import type { Answer, AnyQuestionVariant } from '@openvaa/data';
import type { HTMLAttributes } from 'svelte/elements';

/**
 * The type extends HTMLAttributes<HTMLElement> because we don't know ahead of time which element will be used.
 */
export type InfoAnswerProps = HTMLAttributes<HTMLElement> & {
  /**
   * The possibly missing answer to the question.
   */
  answer?: Answer | null;
  /**
   * The info question object.
   */
  question: AnyQuestionVariant;
  /**
   * How to format the answer. @default 'default'
   * - `default`: use the same format as in `<EntityDetails>`.
   * - `tag`: format the answers as a pill or tag. Nb. links are always rendered as tags.
   */
  format?: 'default' | 'tag';
};
