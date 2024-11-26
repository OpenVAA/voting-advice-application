import {
  AnyEntityVariantData,
  AnyNominationVariantPublicData,
  FullVaaData,
  parseEntityTree,
  parseNominationTree
} from '../internal';

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
