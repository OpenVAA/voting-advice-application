import type { Core } from '@strapi/strapi';
import type { Context, Next } from 'koa';

export default (_config: Record<string, unknown>, { strapi }: { strapi: Core.Strapi }) => {
  return async (_ctx: Context, next: Next) => {
    try {
      await next();
    } catch (error) {
      strapi.plugin('sentry').service('sentry').sendError(error);
      throw error;
    }
  };
};
