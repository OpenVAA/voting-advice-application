import { ObjectFilter } from '@openvaa/filters';
import { unwrapEntity } from '$lib/utils/entities';
import { removeDuplicates } from '$lib/utils/removeDuplicates';
import type { AnyEntityVariant, AnyNominationVariant, EntityType } from '@openvaa/data';

/**
 * The property names of the specific `parentNomination` getters for each parent `EntityType`.
 */
const PARENT_GETTER: Record<Exclude<EntityType, 'candidate'>, string> = {
  alliance: 'allianceNomination',
  faction: 'factionList',
  organization: 'list'
};

/**
 * Create filters for all parent nomination types that exist in the `nominations` array.
 * @param nominations - The nominations of an `EntityType` for which to build filters.
 * @param names - The names of the filters for each parent nomination type.
 * @param locale - The locale used for sorting values.
 * @returns
 */
export function buildParentFilters({
  nominations,
  names,
  locale
}: {
  nominations: Array<AnyNominationVariant>;
  names: Record<keyof typeof PARENT_GETTER, string>;
  locale: string;
}): Array<ObjectFilter<MaybeWrappedEntityVariant, AnyEntityVariant>> {
  const filters = [];

  const allParents = nominations.map((n) => n.parentNomination).filter((p) => p != null);
  if (!allParents.length) return [];

  for (const [type, parent] of Object.entries(PARENT_GETTER)) {
    const parents = removeDuplicates(allParents.filter((p) => p.entityType === type).map((p) => p.entity));
    if (!parents.length) continue;

    filters.push(
      new ObjectFilter<MaybeWrappedEntityVariant, AnyEntityVariant>(
        {
          // We perform the filters on the parent `Entity` objects, which may be wrapped in a `Match`. This unseemly horror can be refactored when `@openvaa/data` is updated
          entityGetter: (target) =>
            (unwrapEntity(target).nomination?.[parent as keyof AnyNominationVariant] ?? {}) as AnyEntityVariant,
          // The property of the parent `Nomination` whose `id` we are interested in
          property: 'entity',
          // Use the `Entity`’s id
          keyProperty: 'id',
          // The property of the parent `Entity`’s to display in the filter
          labelProperty: 'shortName',
          // All of the parent `Entity` objects
          objects: parents,
          // The title of the filter
          name: names[type as keyof typeof PARENT_GETTER]
        },
        locale
      )
    );
  }

  return filters;
}
