import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import type { DeleteDataResult, FindDataResult, ImportDataResult } from 'src/services/data.type';

export default function controller({ strapi }: { strapi: Core.Strapi }) {
  /**
   * Parse the request body, handling both pre-parsed objects (when Content-Type
   * is application/json and Koa's body parser runs) and raw strings (when
   * Content-Type is missing, e.g. from the admin frontend).
   */
  function parseBody(ctx: Context): Record<string, unknown> {
    const body = ctx.request.body;
    if (body && typeof body === 'object') return body as Record<string, unknown>;
    if (typeof body === 'string') return JSON.parse(body);
    return {};
  }

  return {
    import: async (ctx: Context) => {
      try {
        const { data } = parseBody(ctx);

        if (!data) return ctx.badRequest('Invalid request: Missing data');

        const result: ImportDataResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('data')
          .import(data);

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('data.import controller error', error);
        return ctx.internalServerError('An error occurred while importing data');
      }
    },
    delete: async (ctx: Context) => {
      try {
        const { data } = parseBody(ctx);

        if (!data) return ctx.badRequest('Invalid request: Missing data');

        const result: DeleteDataResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('data')
          .delete(data);

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('data.delete controller error', error);
        return ctx.internalServerError('An error occurred while deleting data');
      }
    },
    find: async (ctx: Context) => {
      try {
        const { collection, filters, populate } = parseBody(ctx);

        if (!collection || !filters) return ctx.badRequest('Invalid request: Missing data');

        const result: FindDataResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('data')
          .find({ collection, filters, populate });

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('data.find controller error', error);
        return ctx.internalServerError('An error occurred while finding data');
      }
    },
    findCandidates: async (ctx: Context) => {
      try {
        const { registrationStatus, constituency } = parseBody(ctx);

        if (!registrationStatus) return ctx.badRequest('Invalid request: Missing data');

        const result: FindDataResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('data')
          .findCandidates({ registrationStatus, constituency });

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('data.findCandidates controller error', error);
        return ctx.internalServerError('An error occurred while finding candidates');
      }
    },
  };
}
