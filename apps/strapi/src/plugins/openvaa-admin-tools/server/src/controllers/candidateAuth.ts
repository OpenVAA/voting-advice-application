import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import type { CandidateAuthActionResult } from 'src/services/candidateAuth.type';

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

export default function controller({ strapi }: { strapi: Core.Strapi }) {
  return {
    search: async (ctx: Context) => {
      try {
        const { query } = parseBody(ctx);

        if (!query) return ctx.badRequest('Invalid request: Missing query');

        const result: CandidateAuthActionResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('candidateAuth')
          .searchCandidates({ query: query as string });

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('candidateAuth.search controller error', error);
        return ctx.internalServerError('An error occurred while searching candidates');
      }
    },

    getInfo: async (ctx: Context) => {
      try {
        const { documentId } = parseBody(ctx);

        if (!documentId) return ctx.badRequest('Invalid request: Missing documentId');

        const result: CandidateAuthActionResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('candidateAuth')
          .getCandidateInfo({ documentId: documentId as string });

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('candidateAuth.getInfo controller error', error);
        return ctx.internalServerError('An error occurred while fetching candidate info');
      }
    },

    forceRegister: async (ctx: Context) => {
      try {
        const { documentId, password } = parseBody(ctx);

        if (!documentId || !password)
          return ctx.badRequest('Invalid request: Missing documentId or password');

        const result: CandidateAuthActionResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('candidateAuth')
          .forceRegister({ documentId: documentId as string, password: password as string });

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('candidateAuth.forceRegister controller error', error);
        return ctx.internalServerError('An error occurred while force-registering the candidate');
      }
    },

    sendForgotPassword: async (ctx: Context) => {
      try {
        const { documentId } = parseBody(ctx);

        if (!documentId) return ctx.badRequest('Invalid request: Missing documentId');

        const result: CandidateAuthActionResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('candidateAuth')
          .sendForgotPasswordEmail({ documentId: documentId as string });

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('candidateAuth.sendForgotPassword controller error', error);
        return ctx.internalServerError('An error occurred while sending the forgot password email');
      }
    },

    setPassword: async (ctx: Context) => {
      try {
        const { documentId, password } = parseBody(ctx);

        if (!documentId || !password)
          return ctx.badRequest('Invalid request: Missing documentId or password');

        const result: CandidateAuthActionResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('candidateAuth')
          .setPassword({ documentId: documentId as string, password: password as string });

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('candidateAuth.setPassword controller error', error);
        return ctx.internalServerError('An error occurred while setting the password');
      }
    },

    generatePassword: async (ctx: Context) => {
      try {
        const { username } = parseBody(ctx);

        const result: CandidateAuthActionResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('candidateAuth')
          .generatePassword({ username: (username as string) ?? '' });

        return ctx.send(result);
      } catch (error) {
        strapi.log.error('candidateAuth.generatePassword controller error', error);
        return ctx.internalServerError('An error occurred while generating a password');
      }
    },
  };
}
