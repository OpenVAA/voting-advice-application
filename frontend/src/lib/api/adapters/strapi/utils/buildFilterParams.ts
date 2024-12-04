import type { AnyFilter, FilterValue } from '$lib/api/base/getDataFilters.type';
import type { Params } from '../strapiAdapter.type';

/**
 * Build a `Params` object from the getData options’ possible filters.
 */
export function buildFilterParams({ id, constituencyId, electionId, entityType }: AnyFilter = {}): Params {
  const filters: Params['filters'] = {};
  if (id) filters.id = makeRule(id);
  if (constituencyId) filters.constituency = { id: makeRule(constituencyId) };
  if (electionId) filters.election = { id: makeRule(electionId) };
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
