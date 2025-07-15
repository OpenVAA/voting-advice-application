import { warn } from '../util/logger';
import type { StrapiContext } from '../../types/customStrapiTypes';

/**
 * A placeholder policy that always returns false.
 */
export default function forbidden(ctx: StrapiContext): false {
  warn('[global:forbidden] triggered by', ctx.request);
  return false;
}
