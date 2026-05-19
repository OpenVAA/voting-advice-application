import type { AnyEntityVariant } from '@openvaa/data';
import type { ChoiceQuestionFilter, ObjectFilter } from '@openvaa/filters';
import type { SvelteHTMLElements } from 'svelte/elements';

export type EnumeratedEntityFilterProps = SvelteHTMLElements['div'] & {
  /**
   * The object filter object.
   */
  filter: ObjectFilter<MaybeWrappedEntityVariant, AnyEntityVariant> | ChoiceQuestionFilter<MaybeWrappedEntityVariant>;
  /**
   * The targets of the filter objects.
   */
  targets: Array<MaybeWrappedEntityVariant>;
};
