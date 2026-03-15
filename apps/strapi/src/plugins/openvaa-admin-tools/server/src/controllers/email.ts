import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import type { SendEmailResult } from 'src/services/email.type';

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
    sendEmail: async (ctx: Context) => {
      try {
        const { candidateId, subject, content, requireRegistrationKey } = parseBody(ctx);
        if (
          !subject ||
          !content ||
          !candidateId ||
          (Array.isArray(candidateId) && candidateId.length === 0)
        )
          return ctx.badRequest('Invalid request: Missing data');
        const result: SendEmailResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('email')
          .sendEmail({ candidateId, subject, content, requireRegistrationKey });
        return ctx.send(result);
      } catch (error) {
        strapi.log.error('email.sendEmail controller error', error);
        return ctx.internalServerError('An error occurred while sending the emails');
      }
    },

    sendEmailToUnregistered: async (ctx: Context) => {
      try {
        const { subject, content } = parseBody(ctx);
        if (!subject || !content) return ctx.badRequest('Invalid request: Missing data');
        const result: SendEmailResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('email')
          .sendEmailToUnregistered({ subject, content: content as string });
        return ctx.send(result);
      } catch (error) {
        strapi.log.error('email.sendEmailToUnregistered controller error', error);
        return ctx.internalServerError('An error occurred while sending the emails');
      }
    },
  };
}
