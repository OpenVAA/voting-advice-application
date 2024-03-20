/**
 * A set of functions called "actions" for `admin`
 */

export default {
  sendEmailToUnregistered: async (ctx, next) => {
    const {subject, content} = JSON.parse(ctx.request.body ?? '{}');
    if (!subject || !content) {
      ctx.status = 400;
      ctx.body = 'Invalid request';
      return;
    }

    strapi.service('api::admin.admin').sendEmailToUnregistered(subject, content);

    ctx.status = 200;
  },
  sendEmail: async (ctx, next) => {
    const {candidateId, subject, content} = JSON.parse(ctx.request.body ?? '{}');
    if (!subject || !content || !candidateId) {
      ctx.status = 400;
      ctx.body = 'Invalid request';
      return;
    }
    strapi.service('api::admin.admin').sendEmail(candidateId, subject, content);

    ctx.status = 200;
  }
};
