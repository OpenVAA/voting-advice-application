import type { AnyFilter, FilterValue } from '$lib/api/base/getDataFilters.type';
import type { FilterParams, Params } from '../strapiAdapter.type';

/**
 * Build a `Params` object from the getData options’ possible filters. If multiple, they are joined with `$and`.
 * @param useDocumentId - The `id` param is converted into `documentId` by default. Set to `false` to disable this conversion.
 */
export function buildFilterParams(
  { id, constituencyId, electionId, entityType }: AnyFilter = {},
  { useDocumentId } = { useDocumentId: true }
): Params {
  const filters: FilterParams = {};
  if (id) filters[useDocumentId ? 'documentId' : 'id'] = makeRule(id);
  if (constituencyId) filters.constituency = { documentId: makeRule(constituencyId) };
  if (electionId) filters.election = { documentId: makeRule(electionId) };
  if (entityType) filters.entityType = makeRule(entityType);
  return Object.keys(filters).length ? { filters } : {};
}

/**
 * Make a REST API $eq or $in rule.
 * See: https://docs-v4.strapi.io/dev-docs/api/rest/filters-locale-publication#filtering
 */
export function makeRule(value: FilterValue<unknown>): { $eq: string } | { $in: Array<string> } {
  if (Array.isArray(value)) return { $in: value.map((v) => `${v}`) };
  return { $eq: `${value}` };
}
