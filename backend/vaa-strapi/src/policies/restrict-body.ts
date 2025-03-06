import { StrapiContext } from '../../types/customStrapiTypes';
import { warn } from '../util/logger';

/**
 * A policy that only allows specific fields in the request body.
 * @param config.allowedFields - An array of field names that are allowed. Defaults to none.
 */
export default function restrictBody(ctx: StrapiContext, config = { allowedFields: [] }): boolean {
  if (ctx.request.body?.data) {
    if (config.allowedFields.length === 0) return false;
    for (const key in ctx.request.body.data) {
      if (config.allowedFields.includes(key)) continue;
      warn(`[global:restrict-body] Restricted field ${key} in the body`, ctx.request);
      return false;
    }
  }
  return true;
}

export type RestrictBodyConfig = {
  allowedFields: Array<string>;
};
