import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import type { DeleteDataResult, FindDataResult, ImportDataResult } from 'src/services/data.type';

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
    find: async (ctx: Context) => {
      try {
        const { collection, filters, populate } = JSON.parse(ctx.request.body ?? '{}');

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
        const { registrationStatus, constituency } = JSON.parse(ctx.request.body ?? '{}');

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
    updateNomination: async (ctx: Context) => {
      try {
        /*
        const nomination = JSON.parse(ctx.request.body ?? '{}');

        TODO

        */

        return ctx.send({});
      } catch (error) {
        strapi.log.error('data.findCandidates controller error', error);
        return ctx.internalServerError('An error occurred while finding candidates');
      }
    },
  };
}
