import { parseEntityTree, parseNominationTree } from '../internal';
import type { AnyEntityVariantData, AnyNominationVariantPublicData, FullVaaData } from '../internal';

/**
 * Expands a `FullVaaData` object with possibly tree-like `AnyEntityVariantData` and `AnyNominationVariantPublicData` data into a flat data arrays.
 */
export function parseFullVaaData(
  data: FullVaaData
): FullVaaData<Array<AnyEntityVariantData>, Array<AnyNominationVariantPublicData>> {
  const { entities, nominations, ...rest } = data;
  return {
    entities: Array.isArray(entities) ? entities : parseEntityTree(entities),
    nominations: Array.isArray(nominations) ? nominations : parseNominationTree(nominations),
    ...rest
  };
}
