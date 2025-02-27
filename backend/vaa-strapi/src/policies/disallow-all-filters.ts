import { StrapiContext } from '../../types/customStrapiTypes';
import { warn } from '../util/logger';

/**
 * A policy that disallows all filters.
 */
export default function disallowAllFilters(ctx: StrapiContext): boolean {
  const { filters } = ctx.request.query;
  if (!filters || (typeof filters === 'object' && Object.keys(filters).length === 0)) return true;
  warn('[global:disallow-all-filters] triggered by', ctx.request);
  return false;
}
