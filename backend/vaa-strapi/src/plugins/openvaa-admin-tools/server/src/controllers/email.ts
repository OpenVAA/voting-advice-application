import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import type { SendEmailResult } from 'src/services/email.type';

export default function controller({ strapi }: { strapi: Core.Strapi }) {
  return {
    sendEmail: async (ctx: Context) => {
      try {
        const { candidateId, subject, content, requireRegistrationKey } = JSON.parse(
          ctx.request.body ?? '{}'
        );
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
        const { subject, content } = JSON.parse(ctx.request.body ?? '{}');
        if (!subject || !content) return ctx.badRequest('Invalid request: Missing data');
        const result: SendEmailResult = await strapi
          .plugin('openvaa-admin-tools')
          .service('email')
          .sendEmailToUnregistered({ subject, content });
        return ctx.send(result);
      } catch (error) {
        strapi.log.error('email.sendEmailToUnregistered controller error', error);
        return ctx.internalServerError('An error occurred while sending the emails');
      }
    },
  };
}
