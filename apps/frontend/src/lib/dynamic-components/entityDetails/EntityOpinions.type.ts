import type { AnyQuestionVariant } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';
import type { AnswerStore } from '$lib/contexts/voter';
import type { EntityDetailsProps } from './EntityDetails.type';

export type EntityOpinionsProps = SvelteHTMLElements['div'] & {
  /**
   * A possibly ranked entity, e.g. candidate or a party.
   */
  entity: EntityDetailsProps['entity'];
  /**
   * An array of `opinion` questions.
   */
  questions: Array<AnyQuestionVariant>;
  /**
   * An optional `AnswerStore` with the Voter's answers to the questions.
   */
  answers?: AnswerStore;
};
