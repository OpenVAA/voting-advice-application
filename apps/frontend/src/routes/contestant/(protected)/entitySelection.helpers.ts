/**
 * The pure helper behind the entity-selection view of the Contestant App's root page, at `apps/frontend/src/routes/contestant/(protected)/+page.svelte`.
 *
 * `groupEntitiesForSelection` turns the entities a user edits into the groups the view renders, in the one order the view shows them in: candidates first, then organizations, each group ascending by the displayed name. The order depends on the entities alone, never on the order they were listed in.
 *
 * CALLER CONTRACT: the caller passes ALREADY-READ values. The contestant context's reactive accessors are read INSIDE the calling tracking scope and their values handed over here.
 *
 * The parameter types are STRUCTURAL on purpose. This module imports nothing at all, so a spec that exercises it loads exactly the test runner plus this file.
 *
 * Tested in `entitySelection.helpers.test.ts`.
 */

/** The entity types the view lists, in the order of their groups. */
export const SELECTION_GROUP_ORDER = ['candidate', 'organization'] as const;

/** An entity type the view lists. */
export type SelectionEntityType = (typeof SELECTION_GROUP_ORDER)[number];

/** What the helper needs of an entity: which group it belongs to and a stable tie-break. */
export type SelectableEntity = { type: SelectionEntityType; id: string };

/** One group of the view: the entities of one type, in display order. Never empty. */
export type EntitySelectionGroup<TEntity extends SelectableEntity> = {
  type: SelectionEntityType;
  entities: Array<TEntity>;
};

export type EntitySelection<TEntity extends SelectableEntity> = {
  /** The groups to render, candidates before organizations. A type with no entity has no group. */
  groups: Array<EntitySelectionGroup<TEntity>>;
  /** Whether each group gets a heading: only when entities of both types are listed. */
  showHeadings: boolean;
};

/**
 * Group and order the entities a user chooses from.
 * @param entities - The entities the user edits, in any order.
 * @param locale - The locale the names are compared in.
 * @param displayName - The name an entity is shown by.
 * @returns The groups to render and whether they are headed.
 */
export function groupEntitiesForSelection<TEntity extends SelectableEntity>({
  entities,
  locale,
  displayName
}: {
  entities: ReadonlyArray<TEntity>;
  locale: string;
  displayName: (entity: TEntity) => string;
}): EntitySelection<TEntity> {
  const groups = SELECTION_GROUP_ORDER.map((type) => {
    const named = entities
      .filter((entity) => entity.type === type)
      .map((entity) => ({ entity, name: displayName(entity) }));
    // Names that differ only by case or accent compare as equal, so the id decides and the order never depends on the input order.
    named.sort(
      (a, b) =>
        a.name.localeCompare(b.name, locale, { sensitivity: 'base' }) ||
        (a.entity.id < b.entity.id ? -1 : a.entity.id > b.entity.id ? 1 : 0)
    );
    return { type, entities: named.map(({ entity }) => entity) };
  }).filter((group) => group.entities.length > 0);

  return { groups, showHeadings: groups.length > 1 };
}
