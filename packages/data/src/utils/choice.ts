import { ensureId, type HasId, type Id, isMissingValue } from '../internal';

/**
 * Checks that the `items` form a valid selection of `Choice`s, i.e. there must be at least two of them and they all have unique `Id`s.
 */
export function validateChoices(items: Array<HasId>): boolean {
  if (items.length < 2) return false;
  const ids = new Set<Id>();
  return items.every((o) => {
    const id = ensureId(o.id);
    if (isMissingValue(id)) return false;
    if (ids.has(id)) return false;
    ids.add(id);
    return true;
  });
}
