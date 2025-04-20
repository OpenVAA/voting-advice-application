import { StrapiContext } from '../../types/customStrapiTypes';
import { warn } from '../util/logger';

/**
 * Policy that only allows admin users to use LLM functions.
 * NB! Admin role is different from Strapi admin role
 */
export default function isAdmin(ctx: StrapiContext): boolean {
  const userIsAuthenticated = ctx.state?.isAuthenticated;
  const role = ctx.state?.user?.role?.type;
  if (role === 'admin' && userIsAuthenticated) {
    return true;
  }
  warn('[global::user-is-admin] triggered by:', ctx.request);
  return false;
}
