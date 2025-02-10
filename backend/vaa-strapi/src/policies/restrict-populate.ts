import { StrapiContext } from '../../types/customStrapiTypes';
import { isAllowedPopulate } from '../util/isAllowedPopulate';
import { warn } from '../util/logger';

/**
 * A policy that disallows populating (and thus filter) private resources.
 * @param config.forbiddenRelations - An array of relation names that cannot not be populated. Defaults to ['user'].
 */
export default function restrictPopulate(ctx: StrapiContext, config = DEFAULT_RESTRICT_POPULATE_CONFIG): boolean {
  const query = ctx.request.query;

  if (!query.populate) return true;

  // Allow only the explicit populate syntax (vs. allowing ?populate=*)
  if (typeof query.populate !== 'object') {
    warn(
      '[global:restrict-populate] Disallowing due to not using the explicit ?populate[...]=true syntax in',
      ctx.request
    );
    return false;
  }

  const result = isAllowedPopulate(query.populate, config.forbiddenRelations, config.allowStar);
  if (!result) warn('[global:restrict-populate] Disallowing because isAllowedPopulate() returnd false in', ctx.request);
  return result;
}

/**
 * By default, only the 'user' relation is disallowed.
 */
export const DEFAULT_RESTRICT_POPULATE_CONFIG = {
  forbiddenRelations: ['user'],
  allowStar: undefined
} as const;

export type RestrictPopulateConfig = {
  forbiddenRelations: Array<string>;
  allowStar?: boolean;
};
