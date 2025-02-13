import { DeleteDataResult, ImportDataResult } from 'src/services/utils/data.type';
import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';

export default function controller({ strapi }: { strapi: Core.Strapi }) {
  return {
    import: async (ctx: Context) => {
      try {
        const { data } = JSON.parse(ctx.request.body ?? '{}');

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
        const { data } = JSON.parse(ctx.request.body ?? '{}');

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
  };
}
