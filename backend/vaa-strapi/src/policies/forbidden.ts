import { StrapiContext } from '../../types/customStrapiTypes';
import { warn } from '../util/logger';

/**
 * A placeholder policy that always returns false.
 */
export default function forbidden(ctx: StrapiContext): false {
  warn('[global:forbidden] triggered by', ctx.request);
  return false;
}
