import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import type { CandidateAuthActionResult } from 'src/services/candidateAuth.type';

export default function controller({ strapi }: { strapi: Core.Strapi }) {
  return {
    search: async (ctx: Context) => {
      try {
        const { query } = JSON.parse(ctx.request.body ?? '{}');

        if (!query) return ctx.badRequest('Invalid request: Missing query');

        const result: CandidateAuthActionResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('candidateAuth')
          .searchCandidates({ query });

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('candidateAuth.search controller error', error);
        return ctx.internalServerError('An error occurred while searching candidates');
      }
    },

    getInfo: async (ctx: Context) => {
      try {
        const { documentId } = JSON.parse(ctx.request.body ?? '{}');

        if (!documentId) return ctx.badRequest('Invalid request: Missing documentId');

        const result: CandidateAuthActionResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('candidateAuth')
          .getCandidateInfo({ documentId });

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('candidateAuth.getInfo controller error', error);
        return ctx.internalServerError('An error occurred while fetching candidate info');
      }
    },

    forceRegister: async (ctx: Context) => {
      try {
        const { documentId, password } = JSON.parse(ctx.request.body ?? '{}');

        if (!documentId || !password)
          return ctx.badRequest('Invalid request: Missing documentId or password');

        const result: CandidateAuthActionResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('candidateAuth')
          .forceRegister({ documentId, password });

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('candidateAuth.forceRegister controller error', error);
        return ctx.internalServerError('An error occurred while force-registering the candidate');
      }
    },

    sendForgotPassword: async (ctx: Context) => {
      try {
        const { documentId } = JSON.parse(ctx.request.body ?? '{}');

        if (!documentId) return ctx.badRequest('Invalid request: Missing documentId');

        const result: CandidateAuthActionResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('candidateAuth')
          .sendForgotPasswordEmail({ documentId });

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('candidateAuth.sendForgotPassword controller error', error);
        return ctx.internalServerError('An error occurred while sending the forgot password email');
      }
    },

    setPassword: async (ctx: Context) => {
      try {
        const { documentId, password } = JSON.parse(ctx.request.body ?? '{}');

        if (!documentId || !password)
          return ctx.badRequest('Invalid request: Missing documentId or password');

        const result: CandidateAuthActionResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('candidateAuth')
          .setPassword({ documentId, password });

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('candidateAuth.setPassword controller error', error);
        return ctx.internalServerError('An error occurred while setting the password');
      }
    },

    generatePassword: async (ctx: Context) => {
      try {
        const { username } = JSON.parse(ctx.request.body ?? '{}');

        const result: CandidateAuthActionResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('candidateAuth')
          .generatePassword({ username: username ?? '' });

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('candidateAuth.generatePassword controller error', error);
        return ctx.internalServerError('An error occurred while generating a password');
      }
    },
  };
}
