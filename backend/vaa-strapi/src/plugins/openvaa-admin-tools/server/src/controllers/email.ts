import type { Core } from '@strapi/strapi';

export default function controller({ strapi }: { strapi: Core.Strapi }) {
  return {
    sendEmailToUnregistered: async (ctx) => {
      const { subject, content } = JSON.parse(ctx.request.body ?? '{}');
      if (!subject || !content) {
        ctx.status = 400;
        ctx.body = 'Invalid request';
        return;
      }
      const result = await strapi
        .plugin('openvaa-admin-tools')
        .service('email')
        .sendEmailToUnregistered(subject, content)
        .catch((e) => e);
      if (result.type !== 'success') {
        console.error('sendEmail controller error', result);
        ctx.status = 500;
        ctx.body = 'An error occurred while sending the emails';
      } else {
        ctx.status = 200;
      }
    },
    sendEmail: async (ctx) => {
      const { candidateId, subject, content } = JSON.parse(ctx.request.body ?? '{}');
      if (!subject || !content || !candidateId) {
        console.error('sendEmail invalid', { candidateId, subject, content });
        ctx.status = 400;
        ctx.body = 'Invalid request';
        return;
      }
      const result = await strapi
        .plugin('openvaa-admin-tools')
        .service('email')
        .sendEmail(candidateId, subject, content)
        .catch((e) => e);
      if (result.type !== 'success') {
        console.error('sendEmail controller error', result);
        ctx.status = 500;
        ctx.body = 'An error occurred while sending the email';
      } else {
        ctx.status = 200;
      }
    },
  };
}
