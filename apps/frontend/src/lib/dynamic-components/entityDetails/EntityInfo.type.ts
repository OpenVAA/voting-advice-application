import type { AnyQuestionVariant } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';
import type { EntityDetailsProps } from './EntityDetails.type';

export type EntityInfoProps = SvelteHTMLElements['div'] & {
  /**
   * A possibly ranked entity, e.g. candidate or a party.
   */
  entity: EntityDetailsProps['entity'];
  /**
   * An array of `info` questions.
   */
  questions: Array<AnyQuestionVariant>;
};
