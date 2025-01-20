import { StrapiContext } from '../../types/customStrapiTypes';

/**
 * A policy that only allows specific fields in the request body.
 * @param config.allowedFields - An array of field names that are allowed. Defaults to none.
 */
export default function restrictBody(ctx: StrapiContext, config = { allowedFields: [] }): boolean {
  console.info('Policy: global::restrict-body');
  if (ctx.request.body?.data) {
    if (config.allowedFields.length === 0) return false;
    for (const key in ctx.request.body.data) {
      if (config.allowedFields.includes(key)) continue;
      console.warn(`[restrictBody] Restricted field ${key} in the body in '${ctx.request?.url ?? 'N/A'}'`);
      return false;
    }
  }
  return true;
}

export type RestrictBodyConfig = {
  allowedFields: Array<string>;
};
