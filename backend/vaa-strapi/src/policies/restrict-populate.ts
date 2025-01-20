import { StrapiContext } from '../../types/customStrapiTypes';
import { isAllowedPopulate } from '../util/isAllowedPopulate';

/**
 * A policy that disallows populating (and thus filter) private resources.
 * @param config.forbiddenRelations - An array of relation names that cannot not be populated. Defaults to ['user'].
 */
export default function restrictPopulate(ctx: StrapiContext, config = DEFAULT_RESTRICT_POPULATE_CONFIG): boolean {
  const query = ctx.request.query;

  if (!query.populate) return true;

  // Allow only the explicit populate syntax (vs. allowing ?populate=*)
  if (typeof query.populate !== 'object') {
    console.warn(
      `Disallowing ${query.populate} due to not using the explicit ?populate[...]=true syntax in '${ctx.request?.url ?? 'N/A'}'`
    );
    return false;
  }

  return isAllowedPopulate(query.populate, config.forbiddenRelations);
}

/**
 * By default, only the 'user' relation is disallowed.
 */
export const DEFAULT_RESTRICT_POPULATE_CONFIG = {
  forbiddenRelations: ['user']
} as const;

export type RestrictPopulateConfig = {
  forbiddenRelations: Array<string>;
};
