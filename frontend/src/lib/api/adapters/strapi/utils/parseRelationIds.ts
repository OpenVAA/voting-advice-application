import { formatId } from '$lib/api/utils/formatId';
import type { Id } from '@openvaa/core';
import type { StrapiObject, StrapiRelation, StrapiSingleRelation } from '../strapiData.type';

/**
 * Parse an `Array` of `Ids` from a possibly undefined `StrapiRelation` object. If the `relations` object is undefined, an empty array is returned.
 */
export function parseRelationIds(relations: StrapiRelation<StrapiObject>): Array<Id> {
  if (!relations) return [];
  return relations.map((rel) => formatId(rel.documentId));
}

/**
 * Parse an `Id` from a possibly undefined `StrapiSingleRelation` object. If the `relation` object is undefined, `undefined` is returned.
 */
export function parseSingleRelationId(relation: StrapiSingleRelation<StrapiObject>): Id | undefined {
  if (!relation) return undefined;
  return formatId(relation.documentId);
}
