import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import type { AddCandidateResult, FormOptionsResult } from 'src/services/addCandidate.type';

export default function controller({ strapi }: { strapi: Core.Strapi }) {
  return {
    getFormOptions: async (ctx: Context) => {
      try {
        const result: FormOptionsResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('addCandidate')
          .getFormOptions();

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('addCandidate.getFormOptions controller error', error);
        return ctx.internalServerError('An error occurred while fetching form options');
      }
    },

    submit: async (ctx: Context) => {
      try {
        const { firstName, lastName, email, partyExternalId, constituencyExternalId } = JSON.parse(
          ctx.request.body ?? '{}'
        );

        if (!firstName || !lastName || !email || !partyExternalId || !constituencyExternalId)
          return ctx.badRequest('Invalid request: Missing required fields');

        const result: AddCandidateResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('addCandidate')
          .addCandidate({ firstName, lastName, email, partyExternalId, constituencyExternalId });

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('addCandidate.submit controller error', error);
        return ctx.internalServerError('An error occurred while adding the candidate');
      }
    },
  };
}
