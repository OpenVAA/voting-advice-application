import type { EntityType } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';
import type { CardAction } from '../entityCard';

export type EntityChildrenProps = SvelteHTMLElements['div'] & {
  /**
   * An array of possibly ranked entities, e.g. a party's candidates.
   */
  entities: Array<MaybeWrappedEntityVariant>;
  /**
   * The type of the entities being displayed. Used to pick correct translations.
   */
  entityType: EntityType;
  /**
   * An optional callback for building the card actions for the child possible entities. If nullish, the default action filled in by `EntityCard` will be used. If `false`, no actions will be added.
   */
  action?: ((entity: MaybeWrappedEntityVariant) => CardAction) | false | null;
};
